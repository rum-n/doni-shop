import { createHash } from "crypto";

/**
 * First-party analytics, deliberately minimal.
 *
 * Nothing identifying is stored. There is no cookie, so the site needs no
 * consent banner: `visitorId` is a one-way hash of IP + user agent + a server
 * secret + today's date. It groups one person's views within a day, cannot be
 * reversed, and cannot be joined to tomorrow's data or to any other site.
 */

/** Obvious crawlers. Counting them makes every number meaningless. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|whatsapp|telegram|discord|preview|monitor|headless|lighthouse|pagespeed|gtmetrix|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu|duckduck|phantom|curl|wget|python-requests|axios|node-fetch|go-http|java\/|okhttp/i;

export function isBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true;
  return BOT_PATTERN.test(userAgent);
}

/** Paths that are never counted: the owner's own tooling. */
export function isTrackablePath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  return !/^\/(?:[a-z]{2}\/)?(?:admin|login)(?:\/|$)/i.test(path);
}

export function deviceFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return "desktop";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Reduces a referrer to its hostname, and drops self-referrals.
 *
 * Only the host is kept: a full referrer URL can carry query strings with
 * personal data, and the host is all a report needs.
 */
export function referrerHost(
  referrer: string | null,
  ownHost: string | null
): string | null {
  if (!referrer) return null;

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host) return null;
    if (ownHost && host === ownHost.replace(/^www\./, "")) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

/**
 * Daily-rotating visitor hash.
 *
 * The date in the digest is what makes it rotate: the same person tomorrow
 * hashes differently, so the data cannot build a profile over time. NEXTAUTH_SECRET
 * is reused as the salt so there is no extra variable to configure; without it
 * the hash would be guessable from an IP.
 */
export function visitorHash(
  ip: string | null,
  userAgent: string | null,
  salt: string
): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip ?? "noip"}|${userAgent ?? "noua"}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") || null;
}

/** Country, only if the host puts one on the request. Never geolocated here. */
export function countryFromHeaders(headers: Headers): string | null {
  const code =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code");

  return code && /^[A-Z]{2}$/i.test(code) ? code.toUpperCase() : null;
}

/** A view longer than this is someone leaving a tab open, not reading. */
export const MAX_VIEW_DURATION_MS = 30 * 60 * 1000;


/* ------------------------------------------------------------------------- *
 * Reporting
 *
 * Kept out of the route handler so the aggregation can be exercised directly
 * against known input, rather than only through an authenticated request.
 * ------------------------------------------------------------------------- */

export const ALLOWED_RANGES = [7, 30, 90] as const;
const TOP_N = 10;

/** One stored view, reduced to the fields the report needs. */
export interface ReportableView {
  visitorId: string;
  sessionId: string;
  path: string;
  referrer: string | null;
  device: string;
  locale: string | null;
  country: string | null;
  durationMs: number | null;
  createdAt: Date;
}

export function startOfDayUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** Every day in the range, so the chart has no gaps where traffic was zero. */
export function dayKeys(days: number, now: Date = new Date()): string[] {
  const today = startOfDayUTC(now);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function countBy(
  rows: ReportableView[],
  pick: (row: ReportableView) => string | null
): { label: string; count: number }[] {
  const tally = new Map<string, number>();

  for (const row of rows) {
    const value = pick(row);
    if (!value) continue;
    tally.set(value, (tally.get(value) ?? 0) + 1);
  }

  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Turns raw views into everything the dashboard shows. */
export function summarize(
  views: ReportableView[],
  days: number,
  now: Date = new Date()
) {
  const visitors = new Set(views.map((v) => v.visitorId)).size;
  const pageviews = views.length;

  // A session's time is the sum of its views' measured durations, so a visit
  // that read one page for two minutes is not filed as a zero-second bounce.
  const sessions = new Map<string, { views: number; ms: number }>();

  for (const v of views) {
    const entry = sessions.get(v.sessionId) ?? { views: 0, ms: 0 };
    entry.views += 1;
    entry.ms += v.durationMs ?? 0;
    sessions.set(v.sessionId, entry);
  }

  const sessionList = [...sessions.values()];
  const measured = sessionList.filter((s) => s.ms > 0);

  const avgSessionMs = measured.length
    ? Math.round(measured.reduce((sum, s) => sum + s.ms, 0) / measured.length)
    : 0;

  // A bounce is one page with no measurable reading time.
  const bounces = sessionList.filter((s) => s.views === 1 && s.ms === 0).length;
  const bounceRate = sessionList.length
    ? Math.round((bounces / sessionList.length) * 100)
    : 0;

  const perDay = new Map<string, { visitors: Set<string>; views: number }>();
  for (const key of dayKeys(days, now)) {
    perDay.set(key, { visitors: new Set(), views: 0 });
  }

  for (const v of views) {
    const bucket = perDay.get(v.createdAt.toISOString().slice(0, 10));
    if (!bucket) continue;
    bucket.visitors.add(v.visitorId);
    bucket.views += 1;
  }

  return {
    days,
    totals: {
      visitors,
      pageviews,
      avgSessionMs,
      bounceRate,
      sessions: sessionList.length,
      measuredSessions: measured.length,
    },
    daily: [...perDay.entries()].map(([date, b]) => ({
      date,
      visitors: b.visitors.size,
      views: b.views,
    })),
    topPages: countBy(views, (v) => v.path).slice(0, TOP_N),
    topReferrers: countBy(views, (v) => v.referrer).slice(0, TOP_N),
    // Direct traffic is everything with no referrer, which countBy skips.
    direct: views.filter((v) => !v.referrer).length,
    devices: countBy(views, (v) => v.device),
    locales: countBy(views, (v) => v.locale),
    countries: countBy(views, (v) => v.country).slice(0, TOP_N),
  };
}
