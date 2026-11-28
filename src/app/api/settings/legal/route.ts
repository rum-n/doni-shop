import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { writeLocalizedText } from "@/lib/localized-setting";
import { isLegalPage, legalSettingsKey } from "@/lib/legal";
import { getLegalContent } from "@/lib/legal-server";

/** Admin-only: the public pages read the database directly, server-side. */
export async function GET(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const page = request.nextUrl.searchParams.get("page");

    if (!isLegalPage(page)) {
      return NextResponse.json(
        { message: "Unknown page" },
        { status: 400 }
      );
    }

    return NextResponse.json(await getLegalContent(page));
  } catch (error) {
    console.error("Error fetching a legal page:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the page" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await request.json();

    if (!isLegalPage(body?.page)) {
      return NextResponse.json({ message: "Unknown page" }, { status: 400 });
    }

    const content = writeLocalizedText(body.content);

    if (!content) {
      return NextResponse.json(
        { message: "Expected content with `en` and/or `bg` text" },
        { status: 400 }
      );
    }

    await db.siteSettings.upsert({
      where: { key: legalSettingsKey(body.page) },
      update: { value: content as unknown as Prisma.InputJsonObject },
      create: {
        key: legalSettingsKey(body.page),
        value: content as unknown as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json({ message: "Page updated", content });
  } catch (error) {
    console.error("Error updating a legal page:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the page" },
      { status: 500 }
    );
  }
}
