import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import {
  CLOUDINARY_URL_PREFIX,
  INSTAGRAM_URL,
  STRIP_SIZE,
  type InstagramSlot,
} from "@/lib/instagram";

const SETTINGS_KEY = "instagramStrip";

function readSlots(value: unknown): InstagramSlot[] {
  const items =
    value && typeof value === "object" && "items" in value
      ? (value as { items?: unknown }).items
      : null;

  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is InstagramSlot => {
      if (!item || typeof item !== "object") return false;
      const slot = item as Partial<InstagramSlot>;
      return (
        typeof slot.imageUrl === "string" &&
        slot.imageUrl.startsWith(CLOUDINARY_URL_PREFIX) &&
        typeof slot.postUrl === "string" &&
        INSTAGRAM_URL.test(slot.postUrl)
      );
    })
    .slice(0, STRIP_SIZE);
}

export async function GET() {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    // Always the same shape, empty included, so the caller never reaches
    // through a missing object.
    return NextResponse.json({ items: readSlots(setting?.value) });
  } catch (error) {
    console.error("Error fetching the Instagram strip:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the Instagram strip" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await request.json();
    const submitted = Array.isArray(body?.items) ? body.items : null;

    if (!submitted) {
      return NextResponse.json(
        { message: "Expected an `items` array" },
        { status: 400 }
      );
    }

    if (submitted.length > STRIP_SIZE) {
      return NextResponse.json(
        { message: `The strip holds at most ${STRIP_SIZE} images` },
        { status: 400 }
      );
    }

    // A half-filled slot is a mistake worth reporting rather than discarding,
    // so validate before saving instead of silently dropping entries.
    const items: InstagramSlot[] = [];

    for (const [index, slot] of submitted.entries()) {
      const imageUrl = typeof slot?.imageUrl === "string" ? slot.imageUrl : "";
      const postUrl =
        typeof slot?.postUrl === "string" ? slot.postUrl.trim() : "";

      // An entirely empty slot just means "unused".
      if (!imageUrl && !postUrl) continue;

      if (!imageUrl.startsWith(CLOUDINARY_URL_PREFIX)) {
        return NextResponse.json(
          { message: `Slot ${index + 1}: the image must be uploaded first` },
          { status: 400 }
        );
      }

      if (!INSTAGRAM_URL.test(postUrl)) {
        return NextResponse.json(
          {
            message: `Slot ${index + 1}: the link must be an instagram.com URL`,
          },
          { status: 400 }
        );
      }

      items.push({ imageUrl, postUrl });
    }

    // Prisma's Json input type demands an index signature, which a named
    // interface does not carry. This is the only place the slots cross that
    // boundary, so the cast stays here rather than weakening InstagramSlot.
    const value = { items } as unknown as Prisma.InputJsonObject;

    await db.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value },
      create: { key: SETTINGS_KEY, value },
    });

    return NextResponse.json({ message: "Instagram strip updated", items });
  } catch (error) {
    console.error("Error updating the Instagram strip:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the Instagram strip" },
      { status: 500 }
    );
  }
}
