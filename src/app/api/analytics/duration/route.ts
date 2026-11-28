import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MAX_VIEW_DURATION_MS, isBot } from "@/lib/analytics";

/**
 * Attaches time-on-page to a view already recorded.
 *
 * Sent with `navigator.sendBeacon` when the page is hidden, which cannot read a
 * response — hence the client-generated `viewId` as the key.
 */
export async function POST(request: Request) {
  try {
    if (isBot(request.headers.get("user-agent"))) {
      return new NextResponse(null, { status: 204 });
    }

    const body = await request.json();
    const viewId = typeof body?.viewId === "string" ? body.viewId : "";
    const ms = Number(body?.ms);

    if (!/^[A-Za-z0-9_-]{8,64}$/.test(viewId) || !Number.isFinite(ms) || ms < 0) {
      return new NextResponse(null, { status: 204 });
    }

    // A tab left open all afternoon is not reading time.
    const durationMs = Math.min(Math.round(ms), MAX_VIEW_DURATION_MS);

    // updateMany so an unknown viewId is a no-op rather than an exception.
    await db.pageView.updateMany({
      where: { viewId },
      data: { durationMs },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Analytics: could not record a duration:", error);
    return new NextResponse(null, { status: 204 });
  }
}
