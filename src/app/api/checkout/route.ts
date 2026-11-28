import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import stripe from "@/lib/stripe";
import { routing } from "@/i18n/routing";
import {
  DEFAULT_ZONE,
  ZONE_COUNTRIES,
  isShippingZone,
  optionsForZone,
  type ShippingZone,
} from "@/lib/shipping";
import { getShippingRates } from "@/lib/shipping-server";

// Stripe caps a metadata value at 500 characters. A 24-character ObjectId plus
// a separator is 25, so this many ids always fit.
const MAX_ITEMS = 19;

// Stripe's own ceiling on `product_data.images`. Deliberately separate from
// MAX_ARTWORK_IMAGES: if the shop ever allows more images per listing, the
// extras simply do not reach the Checkout page.
const STRIPE_MAX_PRODUCT_IMAGES = 8;

function resolveBaseUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // `artworkIds` is the cart; `artworkId` is the single-item "Buy now" path.
    const requested: unknown = Array.isArray(body.artworkIds)
      ? body.artworkIds
      : body.artworkId
      ? [body.artworkId]
      : [];

    const artworkIds = Array.from(
      new Set(
        (requested as unknown[]).filter(
          (id): id is string => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)
        )
      )
    );

    if (artworkIds.length === 0) {
      return NextResponse.json(
        { message: "No artwork was selected" },
        { status: 400 }
      );
    }

    if (artworkIds.length > MAX_ITEMS) {
      return NextResponse.json(
        { message: `A single order can hold at most ${MAX_ITEMS} items` },
        { status: 400 }
      );
    }

    // The zone is chosen on this site because hosted Checkout cannot filter
    // shipping options by the address the buyer enters. Narrowing
    // `allowed_countries` to the zone is what keeps the two consistent.
    const zone: ShippingZone = isShippingZone(body.zone)
      ? body.zone
      : DEFAULT_ZONE;

    const locale =
      typeof body.locale === "string" &&
      (routing.locales as readonly string[]).includes(body.locale)
        ? body.locale
        : routing.defaultLocale;

    const artworks = await db.artwork.findMany({
      where: { id: { in: artworkIds } },
    });

    if (artworks.length !== artworkIds.length) {
      return NextResponse.json(
        { message: "Artwork not found" },
        { status: 404 }
      );
    }

    // Anything the owner has marked out of stock cannot be bought, so it has
    // to leave the cart before payment. Name them so the cart can say which.
    const sold = artworks.filter((artwork) => !artwork.inStock);

    if (sold.length > 0) {
      return NextResponse.json(
        {
          message: "Some items are no longer available",
          unavailable: sold.map((artwork) => ({
            id: artwork.id,
            title: artwork.title,
          })),
        },
        { status: 409 }
      );
    }

    const baseUrl = resolveBaseUrl(request);

    // Read from the database, never from the request: an amount sent by the
    // browser could be edited to zero.
    const rates = await getShippingRates();

    const shippingOptions = optionsForZone(zone, rates).map((option) => ({
      shipping_rate_data: {
        type: "fixed_amount" as const,
        display_name: option.label,
        fixed_amount: {
          amount: Math.round(option.amount * 100),
          currency: "eur",
        },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: artworks.map((artwork) => {
        const description =
          typeof artwork.description === "string"
            ? artwork.description
            : (artwork.description as { en?: string; bg?: string })?.en || "";

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: artwork.title,
              // Stripe rejects an empty string, so send the field only if set
              ...(description ? { description: description.slice(0, 500) } : {}),
              images: (artwork.images as { url?: string }[] | null)
                ?.map((image) => image?.url)
                .filter((url): url is string => typeof url === "string")
                .slice(0, STRIPE_MAX_PRODUCT_IMAGES),
            },
            unit_amount: Math.round(artwork.price * 100),
          },
          quantity: 1,
        };
      }),
      mode: "payment",
      locale,
      // These are physical prints: without an address there is nothing to ship to.
      // Restricted to the chosen zone, so the rate below always matches where
      // the parcel is actually going.
      shipping_address_collection: {
        allowed_countries: ZONE_COUNTRIES[
          zone
        ] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      // Bulgaria offers two; the rest of the EU one. Both are safe to show,
      // because every option here belongs to the same zone.
      shipping_options: shippingOptions,
      phone_number_collection: { enabled: true },
      success_url: `${baseUrl}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        artworks.length === 1
          ? `${baseUrl}/${locale}/artwork/${artworks[0].slug}`
          : `${baseUrl}/${locale}/cart`,
      metadata: {
        artworkIds: artworkIds.join(","),
        shippingZone: zone,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { message: "Error creating checkout session" },
      { status: 500 }
    );
  }
}
