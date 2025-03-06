import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import stripe from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { artworkId } = await request.json();

    // Fetch artwork details
    const artwork = await db.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      return NextResponse.json({ message: 'Artwork not found' }, { status: 404 });
    }

    if (!artwork.inStock) {
      return NextResponse.json({ message: 'Artwork is not available for purchase' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: artwork.title,
              description: artwork.description,
              images: artwork.images
                ? artwork.images
                  .filter((img): img is { url: string } =>
                    typeof img === 'object' &&
                    img !== null &&
                    'url' in img &&
                    typeof img.url === 'string')
                  .map(img => img.url)
                : [],
            },
            unit_amount: Math.round(artwork.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/artwork/${artwork.slug}`,
      metadata: {
        artworkId: artwork.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { message: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}