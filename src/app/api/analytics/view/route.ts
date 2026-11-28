import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clientIp,
  countryFromHeaders,
  deviceFromUserAgent,
  isBot,
  isTrackablePath,
  referrerHost,
  visitorHash,
} from "@/lib/analytics";

/**
 * Records one page view. Public and unauthenticated by necessity.
 *
 * Always answers 204, even when the view is dropped: a tracker must never
 * surface an error to a visitor, and a 4xx would show up in their console on a
 * page that is working fine.
 */
export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent");

    // Crawlers would drown the real numbers.
    if (isBot(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const body = await request.json();

    const viewId = typeof body?.viewId === "string" ? body.viewId : "";
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const path = typeof body?.path === "string" ? body.path : "";

    // Guard against a client sending junk, and cap the stored length.
    if (
      !/^[A-Za-z0-9_-]{8,64}$/.test(viewId) ||
      !/^[A-Za-z0-9_-]{8,64}$/.test(sessionId) ||
      !isTrackablePath(path)
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const salt = process.env.NEXTAUTH_SECRET;

    if (!salt) {
      console.error("Analytics: NEXTAUTH_SECRET is needed as the hash salt");
      return new NextResponse(null, { status: 204 });
    }

    const ownHost = request.headers.get("host");

    await db.pageView.create({
      data: {
        viewId,
        sessionId,
        visitorId: visitorHash(clientIp(request.headers), userAgent, salt),
        path: path.slice(0, 300),
        locale: typeof body?.locale === "string" ? body.locale.slice(0, 8) : null,
        referrer: referrerHost(
          typeof body?.referrer === "string" ? body.referrer : null,
          ownHost
        ),
        utmSource:
          typeof body?.utmSource === "string"
            ? body.utmSource.slice(0, 60)
            : null,
        country: countryFromHeaders(request.headers),
        device: deviceFromUserAgent(userAgent),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // A duplicate viewId means the beacon fired twice; nothing to report.
    if ((error as { code?: string })?.code !== "P2002") {
      console.error("Analytics: could not record a view:", error);
    }
    return new NextResponse(null, { status: 204 });
  }
}
