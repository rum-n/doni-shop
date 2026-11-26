import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import stripe from "@/lib/stripe";
import { recordCheckoutSession } from "@/lib/orders";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "Missing stripe signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { message: "Webhook is not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  // A bad signature is never worth retrying, so answer 400 and stop
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const result = await recordCheckoutSession(event.data.object);

      if (result.status === "skipped") {
        console.error(
          `Ignored checkout session ${event.data.object.id}: ${result.reason}`
        );
      }

      // Worth knowing about, but never worth a retry: the order is saved.
      if (result.status === "created" && result.emailProblem) {
        console.error(
          `Order ${result.orderId} was recorded but its emails did not all ` +
            `send: ${result.emailProblem}`
        );
      }

      // Paid for, but marked unavailable. The order exists so the payment is
      // not lost; someone has to fulfil, reprint or refund it.
      if (result.status === "created" && result.unavailable.length > 0) {
        console.error(
          `Order ${result.orderId} contains items marked out of stock and ` +
            `needs manual resolution: ${result.unavailable.join(", ")}`
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Answer 500 so Stripe retries; a paid order must not be dropped silently
    console.error("Webhook handler failed:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
