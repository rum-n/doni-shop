import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { MAX_ARTWORK_IMAGES, normalizeArtwork } from "@/lib/artwork";

// Images are uploaded to Cloudinary by the browser, so the client only ever
// sends us URLs. Reject anything that is not a Cloudinary URL.
const CLOUDINARY_URL_PREFIX = "https://res.cloudinary.com/";

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await request.json();

    // Extract text fields
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const descriptionEn =
      typeof body.description?.en === "string" ? body.description.en : "";
    const descriptionBg =
      typeof body.description?.bg === "string" ? body.description.bg : "";
    const medium = typeof body.medium === "string" ? body.medium.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const unit = typeof body.unit === "string" ? body.unit.trim() : "";

    // The admin form keeps numeric inputs as strings, so coerce them here
    const price = Number(body.price);
    const year = Number(body.year);
    const width = Number(body.width);
    const height = Number(body.height);

    const inStock = Boolean(body.inStock);
    const featured = Boolean(body.featured);

    // Validate required fields
    if (
      !title ||
      !slug ||
      !descriptionEn ||
      !descriptionBg ||
      !Number.isFinite(price) ||
      !medium ||
      !category ||
      !Number.isFinite(year) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      !unit
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate the uploaded image URLs
    const submittedImages = Array.isArray(body.images) ? body.images : [];

    if (submittedImages.length === 0) {
      return NextResponse.json(
        { message: "At least one image is required" },
        { status: 400 }
      );
    }

    // The forms cap this too, but the limit has to hold for any caller.
    if (submittedImages.length > MAX_ARTWORK_IMAGES) {
      return NextResponse.json(
        { message: `At most ${MAX_ARTWORK_IMAGES} images are allowed` },
        { status: 400 }
      );
    }

    const images: { url: string; alt: string }[] = [];

    for (const image of submittedImages) {
      const url = typeof image?.url === "string" ? image.url : "";

      if (!url.startsWith(CLOUDINARY_URL_PREFIX)) {
        return NextResponse.json(
          { message: "Images must be uploaded before saving" },
          { status: 400 }
        );
      }

      images.push({
        url,
        alt: typeof image?.alt === "string" && image.alt ? image.alt : title,
      });
    }

    // Create artwork in database using Prisma
    const artwork = await db.artwork.create({
      data: {
        title,
        slug,
        description: {
          en: descriptionEn,
          bg: descriptionBg,
        } as unknown as string,
        price,
        medium,
        category,
        year,
        dimensions: {
          width,
          height,
          unit,
        },
        images,
        inStock,
        featured,
      },
    });

    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
    // Slug is unique, so a repeated one is a user error rather than a fault
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { message: "An artwork with this slug already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating artwork:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the artwork" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured") === "true";
    const category = searchParams.get("category");
    const inStock = searchParams.get("inStock");
    const ids = searchParams.get("ids");

    // The cart asks for a specific set of ids so it can re-check availability
    // and price in one request before sending the buyer to Stripe.
    if (ids !== null) {
      const wanted = Array.from(
        new Set(
          ids
            .split(",")
            .map((id) => id.trim())
            .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
        )
      ).slice(0, 50);

      if (wanted.length === 0) {
        return NextResponse.json({ artworks: [] });
      }

      const found = await db.artwork.findMany({
        where: { id: { in: wanted } },
      });

      return NextResponse.json({ artworks: found.map(normalizeArtwork) });
    }

    const where: {
      featured?: boolean;
      category?: string;
      inStock?: boolean;
    } = {};

    if (featured) where.featured = true;
    if (category) where.category = category;
    // Explicit `inStock=false` is a real filter, so compare rather than coerce.
    if (inStock === "true") where.inStock = true;
    if (inStock === "false") where.inStock = false;

    const artworks = await db.artwork.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ artworks: artworks.map(normalizeArtwork) });
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching artworks" },
      { status: 500 }
    );
  }
}
