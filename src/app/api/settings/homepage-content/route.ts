import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import {
  EMPTY_LOCALIZED,
  readLocalizedText,
  writeLocalizedText,
} from "@/lib/localized-setting";

const SETTINGS_KEY = "homepageContent";

export async function GET() {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    return NextResponse.json({
      content: setting ? readLocalizedText(setting.value) : EMPTY_LOCALIZED,
    });
  } catch (error) {
    console.error("Error fetching homepage content:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the homepage content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const payload = body as { content?: unknown };
    const content = writeLocalizedText(payload.content ?? body);

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
      { message: "Homepage content updated successfully", content },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating homepage content:", error);
    return NextResponse.json(
      { message: "Failed to update homepage content" },
      { status: 500 }
    );
  }
}
