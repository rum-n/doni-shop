import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Looks up the order behind a Stripe Checkout session, for the confirmation
 * page the buyer lands on after paying.
 *
 * This is deliberately unauthenticated: buyers check out as guests and have no
 * account to sign in to. The Stripe session id is the capability — it is long,
 * unguessable, and only ever handed to the person who paid — so the response
 * is kept to what that person already knows: what they bought and where it is
 * going. No customer id, no payment intent, no other order.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Stripe session ids look like cs_test_… / cs_live_…
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return NextResponse.json(
      { message: "Invalid session id" },
      { status: 400 }
    );
  }

  try {
    const order = await db.order.findUnique({
      where: { orderNumber: sessionId },
      select: {
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        shippingAddress: true,
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            artwork: {
              select: { title: true, slug: true, images: true },
            },
          },
        },
      },
    });

    if (!order) {
      // The webhook may not have landed yet. 202 tells the page to keep
      // waiting rather than to show an error.
      return NextResponse.json(
        { message: "Order is still being processed", pending: true },
        { status: 202 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order by session:", error);
    return NextResponse.json(
      { message: "Error fetching order" },
      { status: 500 }
    );
  }
}
