import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Artwork } from "@/types/Artwork";

type Dimensions = {
  width: string | number;
  height: string | number;
  unit: string;
};

// Images are uploaded to Cloudinary by the browser, so the client only ever
// sends us URLs. Reject anything that is not a Cloudinary URL.
const CLOUDINARY_URL_PREFIX = "https://res.cloudinary.com/";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured") === "true";
    const category = searchParams.get("category");
    const inStock = searchParams.get("inStock") === "true";

    // Build where clause
    const where: {
      featured?: boolean;
      category?: string;
      inStock?: boolean;
    } = {};
    if (featured) where.featured = true;
    if (category) where.category = category;
    if (inStock) where.inStock = true;

    const artworks = await db.artwork.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
    });

    // Process artworks to ensure image URLs are absolute
    const processedArtworks: Artwork[] = artworks.map((artwork) => {
      // Handle description field - convert from JsonValue to proper type
      let description: { en: string; bg: string };

      if (typeof artwork.description === "string") {
        // Old format - convert to new format
        description = {
          en: artwork.description,
          bg: artwork.description,
        };
      } else if (
        artwork.description &&
        typeof artwork.description === "object"
      ) {
        // New format - cast to proper type
        const desc = artwork.description as { en?: string; bg?: string };
        description = {
          en: desc.en || "",
          bg: desc.bg || "",
        };
      } else {
        // Fallback for null or undefined
        description = {
          en: "",
          bg: "",
        };
      }

      return {
        ...artwork,
        description,
        dimensions:
          typeof artwork.dimensions === "object" && artwork.dimensions !== null
            ? {
                width: String((artwork.dimensions as Dimensions).width || ""),
                height: String((artwork.dimensions as Dimensions).height || ""),
                unit: String((artwork.dimensions as Dimensions).unit || ""),
              }
            : { width: "", height: "", unit: "" },
        images:
          artwork.images?.map((image) => {
            if (typeof image === "object" && image !== null && "url" in image) {
              return {
                url: (image.url as string).startsWith("http")
                  ? (image.url as string)
                  : `https://res.cloudinary.com/${
                      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                    }/${image.url as string}`,
                alt: (image as { alt?: string }).alt || artwork.title,
              };
            }
            return { url: "", alt: artwork.title };
          }) || [],
      };
    });

    return NextResponse.json({ artworks: processedArtworks });
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching artworks" },
      { status: 500 }
    );
  }
}
