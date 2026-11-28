import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";
import { sendOrderEmails } from "@/lib/email";

export type RecordResult =
  | {
      status: "created";
      orderId: string;
      unavailable: string[];
      /** Why the order emails did not go out, if they did not. */
      emailProblem?: string;
    }
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

/**
 * Pulls out what the buyer paid for postage and which option they chose.
 *
 * The event payload carries the amount but only a shipping-rate id, so the
 * session is re-read with the rate expanded to get its display name — which is
 * the part that tells the owner whether to send it to a courier office or to
 * the buyer's door.
 */
async function readShipping(session: Stripe.Checkout.Session): Promise<{
  cost: number | null;
  method: string | null;
}> {
  const cost =
    typeof session.shipping_cost?.amount_total === "number"
      ? session.shipping_cost.amount_total / 100
      : null;

  const rate = session.shipping_cost?.shipping_rate;

  if (rate && typeof rate === "object" && rate.display_name) {
    return { cost, method: rate.display_name };
  }

  if (typeof rate === "string") {
    try {
      const expanded = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["shipping_cost.shipping_rate"],
      });
      const full = expanded.shipping_cost?.shipping_rate;

      if (full && typeof full === "object") {
        return { cost, method: full.display_name ?? null };
      }
    } catch (error) {
      // The amount is the important half; a missing label is not worth
      // failing the webhook over.
      console.error(`Could not expand the shipping rate for ${session.id}:`, error);
    }
  }

  return { cost, method: null };
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
 * Availability is not touched here. These are prints, which can be reprinted,
 * so a sale says nothing about whether stock has run out — the shop owner sets
 * `inStock` by hand in the admin when a run is exhausted. An earlier version
 * flipped it to false on the first sale, which quietly pulled a print from the
 * shop after one order.
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

  // The buyer has already paid. If the owner marked something unavailable in
  // the window between checkout and this webhook, the order is still recorded —
  // losing it would lose the payment too — and the conflict is reported so the
  // shop owner can fulfil or refund it deliberately.
  const unavailable = artworks.filter((artwork) => !artwork.inStock);

  const total = (session.amount_total ?? 0) / 100;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const shippingAddress = readShippingAddress(session);
  const shipping = await readShipping(session);

  // Hashing is slow, so keep it outside the transaction
  const password = await unusablePassword();

  // One nested create: Prisma writes the order and its items atomically, and
  // there is no second table to keep in step now that stock is manual.
  const order = await db.order.create({
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
      // `amount_total` already includes postage; shippingCost breaks it out.
      total,
      shippingCost: shipping.cost,
      shippingMethod: shipping.method,
      ...(shippingAddress ? { shippingAddress } : {}),
      paymentIntent,
    },
    include: {
      items: {
        include: {
          artwork: { select: { title: true, medium: true, year: true } },
        },
      },
    },
  });

  // Both emails are best effort: the order is already paid for and saved, so a
  // mail provider outage must not turn into a webhook retry.
  const email_ = await sendOrderEmails(order, email);

  return {
    status: "created",
    orderId: order.id,
    unavailable: unavailable.map((artwork) => artwork.title),
    ...(email_.sent ? {} : { emailProblem: email_.reason }),
  };
}
