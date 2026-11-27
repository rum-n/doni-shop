import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import {
  EMPTY_LOCALIZED,
  readLocalizedText,
  writeLocalizedText,
} from "@/lib/localized-setting";

const SETTINGS_KEY = "aboutMe";

/**
 * Returns the About copy for every locale, so the page can pick one and the
 * admin can edit both. Always the same shape, empty included.
 */
export async function GET() {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    return NextResponse.json({
      content: setting ? readLocalizedText(setting.value) : EMPTY_LOCALIZED,
    });
  } catch (error) {
    console.error("Error fetching about me content:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the about me content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await request.json();
    const content = writeLocalizedText(body.content ?? body);

    if (!content) {
      return NextResponse.json(
        { message: "Expected content with `en` and/or `bg` text" },
        { status: 400 }
      );
    }

    await db.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: content as unknown as Prisma.InputJsonObject },
      create: {
        key: SETTINGS_KEY,
        value: content as unknown as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json(
      { message: "About me content updated successfully", content },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating about me content:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the about me content" },
      { status: 500 }
    );
  }
}
