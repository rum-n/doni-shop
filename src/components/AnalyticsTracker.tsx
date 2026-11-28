"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_KEY = "doni-analytics-session";

/** Short, URL-safe, and not a cookie — sessionStorage dies with the tab. */
function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const fresh = randomId();
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    // Private window or blocked storage: this visit is its own session.
    return randomId();
  }
}

/**
 * Records page views for the admin's own analytics.
 *
 * No cookies, no third party, nothing identifying leaves the browser. The
 * server hashes IP + user agent with a daily salt purely to count unique
 * visitors; it keeps neither input.
 *
 * Admin pages are excluded so the shop owner's own browsing never shows up in
 * the numbers.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Identifies this view across the two requests it makes.
  const viewIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!pathname) return;
    if (/^\/(?:[a-z]{2}\/)?(?:admin|login)(?:\/|$)/i.test(pathname)) return;

    const viewId = randomId();
    viewIdRef.current = viewId;
    startedAtRef.current = Date.now();

    const payload = {
      viewId,
      sessionId: sessionId(),
      path: pathname,
      locale: pathname.split("/")[1] || null,
      // Only on the first page of a visit is this an external referrer.
      referrer: document.referrer || null,
      utmSource: searchParams?.get("utm_source") ?? null,
    };

    // keepalive so the request survives an immediate navigation away.
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Analytics must never break the page it measures.
    });

    /** Reports how long this page was open. Fires at most once. */
    let reported = false;

    const report = () => {
      if (reported || !viewIdRef.current) return;
      reported = true;

      const ms = Date.now() - startedAtRef.current;
      if (ms < 1000) return; // a bounce-through is not reading time

      const body = JSON.stringify({ viewId: viewIdRef.current, ms });

      // sendBeacon is the only thing guaranteed to survive page unload.
      try {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon("/api/analytics/duration", blob)) return;
      } catch {
        // fall through to fetch
      }

      fetch("/api/analytics/duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };

    const onHidden = () => {
      if (document.visibilityState === "hidden") report();
    };

    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", report);

    return () => {
      // A client-side route change unmounts this effect: report the time spent
      // before the next page starts its own clock.
      report();
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", report);
    };
  }, [pathname, searchParams]);

  return null;
}
