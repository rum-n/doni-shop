"use client";

import { useCallback, useEffect, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";

const RANGES = [7, 30, 90] as const;

interface Summary {
  days: number;
  totals: {
    visitors: number;
    pageviews: number;
    avgSessionMs: number;
    bounceRate: number;
    sessions: number;
    measuredSessions: number;
  };
  daily: { date: string; visitors: number; views: number }[];
  topPages: { label: string; count: number }[];
  topReferrers: { label: string; count: number }[];
  direct: number;
  devices: { label: string; count: number }[];
  locales: { label: string; count: number }[];
  countries: { label: string; count: number }[];
}

function formatDuration(ms: number): string {
  if (!ms) return "—";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

function formatCount(n: number): string {
  return n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString();
}

/** Clean axis maximum, so ticks land on round numbers. */
function niceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card card-pad">
      <p className="eyebrow mb-2">{label}</p>
      <p className="text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="meta-text mt-1">{hint}</p>}
    </div>
  );
}

/**
 * Daily visitors. One series, so no legend — the heading names it.
 * Bars carry the only colour on the page; all text stays in the ink tokens.
 */
function DailyChart({ daily }: { daily: Summary["daily"] }) {
  const max = niceMax(Math.max(1, ...daily.map((d) => d.visitors)));
  const ticks = [0, max / 2, max];

  return (
    <div className="card card-pad">
      <h2 className="section-title mb-1">Visitors per day</h2>
      <p className="meta-text mb-6">
        Unique visitors, counted once per person per day.
      </p>

      <div className="flex gap-3">
        {/* y-axis ticks */}
        <div className="flex h-44 w-10 flex-col justify-between text-right">
          {[...ticks].reverse().map((t) => (
            <span
              key={t}
              className="text-[11px] text-ink-faint tabular-nums leading-none"
            >
              {Math.round(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* hairline gridlines, recessive */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-line" />
            ))}
          </div>

          {/* 2px of surface separates neighbouring bars */}
          <ul className="relative flex h-44 items-end gap-[2px]">
            {daily.map((d) => {
              const pct = max ? (d.visitors / max) * 100 : 0;

              return (
                <li
                  key={d.date}
                  className="group relative flex h-full flex-1 items-end"
                  // the hit target is the whole column, not the painted bar
                  tabIndex={0}
                  aria-label={`${d.date}: ${d.visitors} visitors, ${d.views} views`}
                >
                  <div
                    className="w-full max-w-[24px] mx-auto rounded-t-[4px] bg-accent transition-opacity group-hover:opacity-80 group-focus:opacity-80"
                    style={{ height: `${Math.max(pct, d.visitors ? 2 : 0)}%` }}
                  />

                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-media border border-line bg-surface px-3 py-2 shadow-card-hover group-hover:block group-focus:block">
                    <p className="text-sm font-semibold text-ink tabular-nums">
                      {d.visitors} visitors
                    </p>
                    <p className="text-xs text-ink-muted tabular-nums">
                      {d.views} views
                    </p>
                    <p className="mt-1 text-[11px] text-ink-faint">{d.date}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-2 flex justify-between">
            <span className="text-[11px] text-ink-faint">
              {daily[0]?.date}
            </span>
            <span className="text-[11px] text-ink-faint">
              {daily[daily.length - 1]?.date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankedTable({
  title,
  subtitle,
  rows,
  total,
  empty,
}: {
  title: string;
  subtitle?: string;
  rows: { label: string; count: number }[];
  total: number;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="card card-pad">
      <h2 className="section-title mb-1">{title}</h2>
      {subtitle && <p className="meta-text mb-4">{subtitle}</p>}

      {rows.length === 0 ? (
        <p className="meta-text py-6">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row) => (
            <li key={row.label} className="relative">
              {/* the bar is a wash behind the row, so the text stays readable */}
              <div
                className="absolute inset-y-0 left-0 rounded-[4px] bg-accent/10"
                style={{ width: `${(row.count / max) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-4 px-2 py-2">
                <span className="truncate text-sm font-light text-ink-soft">
                  {row.label}
                </span>
                <span className="shrink-0 text-sm text-ink tabular-nums">
                  {formatCount(row.count)}
                  <span className="ml-2 text-ink-faint">
                    {total ? Math.round((row.count / total) * 100) : 0}%
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (range: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/summary?days=${range}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData(await response.json());
      setError(null);
    } catch (err) {
      console.error("Could not load analytics:", err);
      setError("Could not load analytics. Please reload the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const totals = data?.totals;

  return (
    <>
      <AdminNavbar />
      <div className="page-shell page-width">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="meta-text mt-1">
              First-party and cookie-free. No data leaves this site.
            </p>
          </div>

          {/* Filters: one row, above everything they scope. */}
          <div className="pill-group" role="group" aria-label="Date range">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                aria-pressed={days === range}
                className={`pill ${days === range ? "pill-active" : "pill-idle"}`}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>

        {error && <div className="notice-error mb-6">{error}</div>}

        {!data && loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner h-10 w-10" />
          </div>
        ) : data && totals ? (
          // Hold the previous render while refetching: no layout jump.
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile
                label="Visitors"
                value={formatCount(totals.visitors)}
                hint={`${formatCount(totals.sessions)} visits`}
              />
              <StatTile
                label="Page views"
                value={formatCount(totals.pageviews)}
                hint={
                  totals.sessions
                    ? `${(totals.pageviews / totals.sessions).toFixed(1)} per visit`
                    : undefined
                }
              />
              <StatTile
                label="Time on site"
                value={formatDuration(totals.avgSessionMs)}
                hint={`average of ${formatCount(totals.measuredSessions)} measured`}
              />
              <StatTile
                label="Bounce rate"
                value={`${totals.bounceRate}%`}
                hint="one page, no reading time"
              />
            </div>

            <div className="mb-6">
              <DailyChart daily={data.daily} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <RankedTable
                title="Pages"
                subtitle="Most viewed"
                rows={data.topPages}
                total={totals.pageviews}
                empty="No page views yet."
              />
              <RankedTable
                title="Where visitors come from"
                subtitle={`${formatCount(data.direct)} arrived directly or from a private link`}
                rows={data.topReferrers}
                total={totals.pageviews}
                empty="No referrers recorded yet."
              />
              <RankedTable
                title="Devices"
                rows={data.devices}
                total={totals.pageviews}
                empty="No data yet."
              />
              <RankedTable
                title="Language"
                rows={data.locales}
                total={totals.pageviews}
                empty="No data yet."
              />
              {data.countries.length > 0 && (
                <RankedTable
                  title="Countries"
                  rows={data.countries}
                  total={totals.pageviews}
                  empty="No data yet."
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
