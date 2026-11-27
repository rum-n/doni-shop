import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { MAX_ARTWORK_IMAGES, normalizeArtwork } from "@/lib/artwork";
import { deleteImages } from "@/lib/cloudinary";

// Images are uploaded to Cloudinary by the browser, so the client only ever
// sends us URLs. Reject anything that is not a Cloudinary URL.
const CLOUDINARY_URL_PREFIX = "https://res.cloudinary.com/";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const slugFromPath = pathParts[pathParts.length - 1];

  const slug = (await params).slug || slugFromPath;

  if (!slug) {
    return NextResponse.json(
      { message: "Artwork slug is required" },
      { status: 400 }
    );
  }

  try {
    // First try to find by slug
    let artwork = await db.artwork.findUnique({
      where: { slug },
    });

    // If not found by slug, check if the provided value is an ID (MongoDB ObjectID)
    if (!artwork && /^[0-9a-fA-F]{24}$/.test(slug)) {
      artwork = await db.artwork.findUnique({
        where: { id: slug },
      });
    }

    if (!artwork) {
      return NextResponse.json(
        { message: "Artwork not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ artwork: normalizeArtwork(artwork) });
  } catch (error) {
    console.error("Error fetching artwork:", error);
    return NextResponse.json(
      { message: "Error fetching artwork", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await request.json();
    const slugOrId = (await params).slug;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const medium = typeof body.medium === "string" ? body.medium.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";

    // Numbers arrive as strings from the form, and a price of 0 is legitimate,
    // so test for a finite number rather than for truthiness.
    const price = Number(body.price);
    const year = Number(body.year);

    const descriptionEn =
      typeof body.description === "string"
        ? body.description
        : typeof body.description?.en === "string"
        ? body.description.en
        : "";
    const descriptionBg =
      typeof body.description === "string"
        ? body.description
        : typeof body.description?.bg === "string"
        ? body.description.bg
        : "";

    const width = Number(body.dimensions?.width);
    const height = Number(body.dimensions?.height);
    const unit =
      typeof body.dimensions?.unit === "string"
        ? body.dimensions.unit.trim()
        : "";

    if (
      !title ||
      !slug ||
      !medium ||
      !category ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(year)
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Same rule as creation: the browser uploads to Cloudinary and sends URLs,
    // so anything else is either a mistake or someone poking at the endpoint.
    const submittedImages = Array.isArray(body.images) ? body.images : [];
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

    if (images.length === 0) {
      return NextResponse.json(
        { message: "At least one image is required" },
        { status: 400 }
      );
    }

    if (images.length > MAX_ARTWORK_IMAGES) {
      return NextResponse.json(
        { message: `At most ${MAX_ARTWORK_IMAGES} images are allowed` },
        { status: 400 }
      );
    }

    // Check if artwork exists - try by slug first, then by ID
    let existingArtwork = await db.artwork.findUnique({
      where: { slug: slugOrId },
    });

    // If not found by slug, check if the provided value is an ID (MongoDB ObjectID)
    if (!existingArtwork && /^[0-9a-fA-F]{24}$/.test(slugOrId)) {
      existingArtwork = await db.artwork.findUnique({
        where: { id: slugOrId },
      });
    }

    if (!existingArtwork) {
      return NextResponse.json(
        { message: "Artwork not found" },
        { status: 404 }
      );
    }

    // Check if slug is unique (excluding the current artwork)
    if (slug !== existingArtwork.slug) {
      const slugExists = await db.artwork.findFirst({
        where: {
          slug,
          id: { not: existingArtwork.id },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { message: "Slug must be unique" },
          { status: 400 }
        );
      }
    }

    // Update artwork
    const updatedArtwork = await db.artwork.update({
      where: { id: existingArtwork.id },
      data: {
        title,
        slug,
        description: { en: descriptionEn, bg: descriptionBg },
        price,
        medium,
        // Was never written before, so an artwork could not change category.
        category,
        year,
        dimensions: {
          width: Number.isFinite(width) ? width : 0,
          height: Number.isFinite(height) ? height : 0,
          // Falling back to the stored unit keeps an older row's value rather
          // than blanking it.
          unit:
            unit ||
            String(
              (existingArtwork.dimensions as { unit?: string } | null)?.unit ??
                ""
            ),
        },
        inStock: Boolean(body.inStock),
        featured: Boolean(body.featured),
        images,
      },
    });

    return NextResponse.json({ artwork: updatedArtwork });
  } catch (error) {
    console.error("Error updating artwork:", error);
    return NextResponse.json(
      { message: "Error updating artwork" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const slugOrId = (await params).slug;

    // Check if artwork exists - try by slug first, then by ID
    let existingArtwork = await db.artwork.findUnique({
      where: { slug: slugOrId },
    });

    // If not found by slug, check if the provided value is an ID (MongoDB ObjectID)
    if (!existingArtwork && /^[0-9a-fA-F]{24}$/.test(slugOrId)) {
      existingArtwork = await db.artwork.findUnique({
        where: { id: slugOrId },
      });
    }

    if (!existingArtwork) {
      return NextResponse.json(
        { message: "Artwork not found" },
        { status: 404 }
      );
    }

    // Check if artwork has orders - prevent deletion if it does
    const ordersWithArtwork = await db.order.findMany({
      where: {
        items: {
          some: {
            artworkId: existingArtwork.id,
          },
        },
      },
    });

    if (ordersWithArtwork.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete artwork with associated orders" },
        { status: 400 }
      );
    }

    // Collect the image URLs before the row goes, so the uploaded files can be
    // cleaned up afterwards rather than lingering in Cloudinary forever.
    const imageUrls = (existingArtwork.images ?? [])
      .map((image) =>
        typeof image === "object" && image !== null && "url" in image
          ? (image as { url?: unknown }).url
          : null
      )
      .filter((url): url is string => typeof url === "string");

    await db.artwork.delete({
      where: { id: existingArtwork.id },
    });

    // Best effort, and deliberately after the row is gone: the record being
    // deleted is what the caller asked for.
    await deleteImages(imageUrls);

    return NextResponse.json({ message: "Artwork deleted successfully" });
  } catch (error) {
    console.error("Error deleting artwork:", error);
    return NextResponse.json(
      { message: "Error deleting artwork" },
      { status: 500 }
    );
  }
}
