import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { ALLOWED_RANGES, startOfDayUTC, summarize } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const requested = Number(request.nextUrl.searchParams.get("days"));
    const days = (ALLOWED_RANGES as readonly number[]).includes(requested)
      ? requested
      : 30;

    const since = startOfDayUTC(new Date());
    since.setUTCDate(since.getUTCDate() - (days - 1));

    // One read of the window, then tally in memory. At this shop's volume that
    // is simpler than a pipeline per metric, and it keeps every number
    // consistent with the same slice.
    const views = await db.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: {
        visitorId: true,
        sessionId: true,
        path: true,
        referrer: true,
        device: true,
        locale: true,
        country: true,
        durationMs: true,
        createdAt: true,
      },
    });

    return NextResponse.json(summarize(views, days));
  } catch (error) {
    console.error("Analytics: could not build the summary:", error);
    return NextResponse.json(
      { message: "Could not load analytics" },
      { status: 500 }
    );
  }
}
