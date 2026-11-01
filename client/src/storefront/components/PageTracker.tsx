import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useStore } from "../StoreContext";

const LANDING_KEY = "cbg-landing-sent";

type Visit = { path: string; resumedAt: number | null; visibleMs: number; sent: boolean };

/** Sends the time spent on a page; keepalive lets it survive tab closes and navigations. */
function flush(visit: Visit) {
  if (visit.sent) return;
  visit.sent = true;
  const ms = visit.visibleMs + (visit.resumedAt ? Date.now() - visit.resumedAt : 0);
  const seconds = Math.round(ms / 1000);
  if (seconds < 1) return;
  try {
    void fetch("/api/trpc/order.recordEvent", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: { eventType: "page_time", path: visit.path, seconds } }),
    }).catch(() => undefined);
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * First-party, cookie-less page analytics: one pageview per route, the traffic source on the
 * landing page of each visit, and the visible time spent on every page.
 */
export function PageTracker() {
  const [location] = useLocation();
  const { track } = useStore();
  const visit = useRef<Visit | null>(null);

  useEffect(() => {
    if (location.startsWith("/admin")) return;

    let referrer: string | undefined;
    try {
      if (!window.sessionStorage.getItem(LANDING_KEY)) {
        referrer = document.referrer || "";
        window.sessionStorage.setItem(LANDING_KEY, "1");
      }
    } catch {
      /* storage unavailable */
    }
    track("pageview", undefined, { path: location, referrer });
    const v: Visit = { path: location, resumedAt: document.hidden ? null : Date.now(), visibleMs: 0, sent: false };
    visit.current = v;

    return () => {
      flush(v);
      visit.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    // Pause the clock while the tab is in the background.
    const onVisibility = () => {
      const v = visit.current;
      if (!v) return;
      if (document.hidden && v.resumedAt) {
        v.visibleMs += Date.now() - v.resumedAt;
        v.resumedAt = null;
      } else if (!document.hidden && !v.resumedAt) {
        v.resumedAt = Date.now();
      }
    };
    const onPageHide = () => {
      if (visit.current) flush(visit.current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
