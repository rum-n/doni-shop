import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import {
  DEFAULT_RATES,
  parseShippingRates,
  readShippingRates,
} from "@/lib/shipping";

const SETTINGS_KEY = "shippingRates";

/** Public: the cart shows the cost before the buyer leaves the site. */
export async function GET() {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    return NextResponse.json({
      rates: setting ? readShippingRates(setting.value) : DEFAULT_RATES,
      /** True until the owner has saved real amounts at least once. */
      usingDefaults: !setting,
    });
  } catch (error) {
    console.error("Error fetching shipping rates:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching shipping rates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const body = await request.json();
    const rates = parseShippingRates(body?.rates ?? body);

    if (!rates) {
      return NextResponse.json(
        {
          message:
            "Each rate must be a number between 0 and 1000 EUR. Use 0 for free shipping.",
        },
        { status: 400 }
      );
    }

    await db.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: rates as unknown as Prisma.InputJsonObject },
      create: {
        key: SETTINGS_KEY,
        value: rates as unknown as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json({ message: "Shipping rates updated", rates });
  } catch (error) {
    console.error("Error updating shipping rates:", error);
    return NextResponse.json(
      { message: "An error occurred while updating shipping rates" },
      { status: 500 }
    );
  }
}
