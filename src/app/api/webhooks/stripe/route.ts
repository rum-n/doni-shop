import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe';
import { db } from '@/lib/db';

interface StripeSession {
  id: string;
  metadata: Record<string, string>;
  amount_total: number;
  customer_details: {
    email: string;
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  if (!signature) {
    return NextResponse.json({ message: 'Missing stripe signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      // process.env.STRIPE_WEBHOOK_SECRET!
      ""
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as unknown as StripeSession;

      if (!session.metadata?.artworkId) {
        console.error('Missing artworkId in session metadata');
        return NextResponse.json({ message: 'Invalid session data' }, { status: 400 });
      }

      await db.artwork.update({
        where: { id: session.metadata.artworkId },
        data: { inStock: false },
      });

      await db.order.create({
        data: {
          orderNumber: session.id,
          customer: { connect: { email: session.customer_details.email } },
          items: {
            create: {
              artwork: { connect: { id: session.metadata.artworkId } },
              price: session.amount_total / 100,
              quantity: 1,
            },
          },
          total: session.amount_total / 100,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};