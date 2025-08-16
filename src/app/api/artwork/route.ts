import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadImage } from "@/lib/uploadImage";
import { Artwork } from "@/types/Artwork";

type Dimensions = {
  width: string | number;
  height: string | number;
  unit: string;
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();

    // Extract text fields
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const descriptionEn = formData.get("description[en]") as string;
    const descriptionBg = formData.get("description[bg]") as string;
    const price = parseFloat(formData.get("price") as string);
    const medium = formData.get("medium") as string;
    const category = formData.get("category") as string;
    const year = parseInt(formData.get("year") as string);
    const width = parseFloat(formData.get("width") as string);
    const height = parseFloat(formData.get("height") as string);
    const unit = formData.get("unit") as string;
    const inStock = formData.get("inStock") === "true";
    const featured = formData.get("featured") === "true";

    // Validate required fields
    if (
      !title ||
      !slug ||
      !descriptionEn ||
      !descriptionBg ||
      isNaN(price) ||
      !medium ||
      !category ||
      isNaN(year) ||
      isNaN(width) ||
      isNaN(height) ||
      !unit
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process images
    const imageUrls = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image-") && value instanceof Blob) {
        const imageUrl = await uploadImage(value);
        // Store the image URL without any locale prefix
        imageUrls.push({
          url: imageUrl,
          alt: title, // Default alt text
        });
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { message: "At least one image is required" },
        { status: 400 }
      );
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
        images: imageUrls,
        inStock,
        featured,
      },
    });

    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
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
