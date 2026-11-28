import { summarize, type ReportableView } from "../src/lib/analytics";

const NOW = new Date("2026-11-28T12:00:00Z");
const day = (d: string, h = 10) => new Date(`${d}T${String(h).padStart(2, "0")}:00:00Z`);

function v(p: Partial<ReportableView>): ReportableView {
  return {
    visitorId: "v1", sessionId: "s1", path: "/en", referrer: null,
    device: "desktop", locale: "en", country: null, durationMs: null,
    createdAt: day("2026-11-28"), ...p,
  };
}

const views: ReportableView[] = [
  // visitor A: 2 pages, 30s + 60s  -> a real 90s session, not a bounce
  v({ visitorId: "A", sessionId: "sA", path: "/en/shop", durationMs: 30_000, referrer: "google.com" }),
  v({ visitorId: "A", sessionId: "sA", path: "/en/about", durationMs: 60_000 }),
  // visitor B: 1 page, read for 120s -> single page but NOT a bounce
  v({ visitorId: "B", sessionId: "sB", path: "/en/shop", durationMs: 120_000, device: "mobile" }),
  // visitor C: 1 page, no time recorded -> a bounce
  v({ visitorId: "C", sessionId: "sC", path: "/bg/shop", locale: "bg", device: "mobile" }),
  // visitor A again yesterday, so daily buckets differ from totals
  v({ visitorId: "A", sessionId: "sD", path: "/en/shop", createdAt: day("2026-11-27"), durationMs: 10_000 }),
];

const r = summarize(views, 7, NOW);
let bad = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name.padEnd(42)} ${JSON.stringify(got)}${ok ? "" : `  want ${JSON.stringify(want)}`}`);
};

check("unique visitors (A,B,C)", r.totals.visitors, 3);
check("pageviews", r.totals.pageviews, 5);
check("sessions", r.totals.sessions, 4);
check("sessions with measured time", r.totals.measuredSessions, 3);
// (90s + 120s + 10s) / 3 = 73.33s
check("avg session ms", r.totals.avgSessionMs, 73_333);
// only sC bounced: 1 of 4
check("bounce rate %", r.totals.bounceRate, 25);
check("direct (no referrer)", r.direct, 4);
check("top page", r.topPages[0], { label: "/en/shop", count: 3 });
check("top referrer", r.topReferrers[0], { label: "google.com", count: 1 });
check("devices", r.devices, [{ label: "mobile", count: 2 }, { label: "desktop", count: 3 }].sort((a,b)=>b.count-a.count));
check("locales", r.locales, [{ label: "en", count: 4 }, { label: "bg", count: 1 }]);
check("daily buckets = range length", r.daily.length, 7);
check("today's visitors", r.daily[6], { date: "2026-11-28", visitors: 3, views: 4 });
check("yesterday's visitors", r.daily[5], { date: "2026-11-27", visitors: 1, views: 1 });
check("empty day is present, not missing", r.daily[0], { date: "2026-11-22", visitors: 0, views: 0 });

const empty = summarize([], 30, NOW);
check("empty: no divide-by-zero", [empty.totals.avgSessionMs, empty.totals.bounceRate], [0, 0]);
check("empty: still 30 day buckets", empty.daily.length, 30);

console.log(bad ? `\n${bad} failed` : "\nall aggregation checks pass");
process.exit(bad ? 1 : 0);
