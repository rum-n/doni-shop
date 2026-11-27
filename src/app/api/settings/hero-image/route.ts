import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { EMPTY_LOCALIZED, readLocalizedText } from "@/lib/localized-setting";

// The browser uploads straight to Cloudinary using a signature from
// /api/upload/signature, so this route only ever stores a URL.
const CLOUDINARY_URL_PREFIX = "https://res.cloudinary.com/";

/** Pulls a string out of a SiteSettings value stored either raw or wrapped. */
function readValue(
  value: unknown,
  key: "url" | "content"
): string | null {
  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    const field = (value as Record<string, unknown>)[key];
    if (typeof field === "string") return field;
  }

  return null;
}

export async function GET() {
  try {
    const [heroSetting, homepageSetting] = await Promise.all([
      db.siteSettings.findUnique({ where: { key: "heroImage" } }),
      db.siteSettings.findUnique({ where: { key: "homepageContent" } }),
    ]);

    // Both are null on a fresh install. Always answer with the same shape so
    // callers never have to reach through a missing object.
    return NextResponse.json({
      imageUrl: readValue(heroSetting?.value, "url"),
      homepageContent: homepageSetting
        ? readLocalizedText(homepageSetting.value)
        : EMPTY_LOCALIZED,
    });
  } catch (error) {
    console.error("Error fetching hero image:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the hero image" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await request.json();
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";

    if (!imageUrl.startsWith(CLOUDINARY_URL_PREFIX)) {
      return NextResponse.json(
        { message: "The image must be uploaded before saving" },
        { status: 400 }
      );
    }

    await db.siteSettings.upsert({
      where: { key: "heroImage" },
      update: { value: { url: imageUrl } },
      create: { key: "heroImage", value: { url: imageUrl } },
    });

    return NextResponse.json(
      { message: "Hero image updated successfully", imageUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating hero image:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the hero image" },
      { status: 500 }
    );
  }
}
