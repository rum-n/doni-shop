import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import type Stripe from "stripe";
import { db } from "@/lib/db";

export type RecordResult =
  | { status: "created"; orderId: string; oversold: string[] }
  | { status: "duplicate" }
  | { status: "skipped"; reason: string };

// Buyers check out as guests, so we create a customer record they cannot sign
// in to. The password is random, never shared, and never matches a login.
async function unusablePassword(): Promise<string> {
  return hash(randomBytes(32).toString("hex"), 10);
}

function readArtworkIds(session: Stripe.Checkout.Session): string[] {
  // `artworkIds` is what checkout writes today. `artworkId` is kept so that a
  // session created before the cart existed still becomes an order.
  const many = session.metadata?.artworkIds;

  if (many) {
    return many
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  const one = session.metadata?.artworkId;
  return one ? [one] : [];
}

/** Flattens Stripe's address into something the order page can print. */
function readShippingAddress(session: Stripe.Checkout.Session) {
  const collected =
    session.collected_information?.shipping_details ??
    // Older API versions put it here
    (session as unknown as { shipping_details?: Stripe.Checkout.Session.CollectedInformation.ShippingDetails })
      .shipping_details;

  const address = collected?.address;

  if (!address) {
    return null;
  }

  return {
    name: collected?.name ?? session.customer_details?.name ?? null,
    phone: session.customer_details?.phone ?? null,
    line1: address.line1 ?? null,
    line2: address.line2 ?? null,
    city: address.city ?? null,
    postalCode: address.postal_code ?? null,
    state: address.state ?? null,
    country: address.country ?? null,
  };
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
  const artworkIds = readArtworkIds(session);

  if (artworkIds.length === 0) {
    // Nothing we can do with this session, and retrying will not help
    return {
      status: "skipped",
      reason: "missing artworkIds in session metadata",
    };
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

  const artworks = await db.artwork.findMany({
    where: { id: { in: artworkIds } },
    select: { id: true, price: true, inStock: true, title: true },
  });

  if (artworks.length === 0) {
    return {
      status: "skipped",
      reason: `none of the artworks ${artworkIds.join(", ")} still exist`,
    };
  }

  // The buyer has already paid. If a piece sold in the window between checkout
  // and this webhook, the order is still recorded — losing it would lose the
  // payment too — and the conflict is reported so the shop owner can refund.
  const oversold = artworks.filter((artwork) => !artwork.inStock);

  const total = (session.amount_total ?? 0) / 100;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const shippingAddress = readShippingAddress(session);

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
          create: artworks.map((artwork) => ({
            artwork: { connect: { id: artwork.id } },
            // The price charged, captured at the time of sale, so later edits
            // to the artwork never rewrite order history.
            price: artwork.price,
            quantity: 1,
          })),
        },
        total,
        ...(shippingAddress ? { shippingAddress } : {}),
        paymentIntent,
      },
    });

    await tx.artwork.updateMany({
      where: { id: { in: artworks.map((artwork) => artwork.id) } },
      data: { inStock: false },
    });

    return created;
  });

  return {
    status: "created",
    orderId: order.id,
    oversold: oversold.map((artwork) => artwork.title),
  };
}
