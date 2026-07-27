import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import type Stripe from "stripe";
import { db } from "@/lib/db";

export type RecordResult =
  | { status: "created"; orderId: string }
  | { status: "duplicate" }
  | { status: "skipped"; reason: string };

// Buyers check out as guests, so we create a customer record they cannot sign
// in to. The password is random, never shared, and never matches a login.
async function unusablePassword(): Promise<string> {
  return hash(randomBytes(32).toString("hex"), 10);
}

/**
 * Turns a completed Stripe Checkout session into an order.
 *
 * The order is written before the artwork is marked sold, and both happen in
 * one transaction, so a failure can never leave a piece marked unavailable
 * with no order behind it.
 */
export async function recordCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<RecordResult> {
  const artworkId = session.metadata?.artworkId;

  if (!artworkId) {
    // Nothing we can do with this session, and retrying will not help
    return { status: "skipped", reason: "missing artworkId in session metadata" };
  }

  // Stripe retries webhooks and may deliver the same event more than once
  const existing = await db.order.findUnique({
    where: { orderNumber: session.id },
    select: { id: true },
  });

  if (existing) {
    return { status: "duplicate" };
  }

  const email = session.customer_details?.email;

  if (!email) {
    // Loud failure: better a retried webhook than a silently lost sale
    throw new Error(`Checkout session ${session.id} has no customer email`);
  }

  const total = (session.amount_total ?? 0) / 100;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Hashing is slow, so keep it outside the transaction
  const password = await unusablePassword();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: session.id,
        customer: {
          connectOrCreate: {
            where: { email },
            create: {
              email,
              name: session.customer_details?.name ?? null,
              password,
              role: "customer",
            },
          },
        },
        items: {
          create: {
            artwork: { connect: { id: artworkId } },
            price: total,
            quantity: 1,
          },
        },
        total,
        paymentIntent,
      },
    });

    await tx.artwork.update({
      where: { id: artworkId },
      data: { inStock: false },
    });

    return created;
  });

  return { status: "created", orderId: order.id };
}
