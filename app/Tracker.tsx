"use client";

import { useEffect } from "react";
import { SECTIONS } from "@/lib/track";

let sid = "";
export function sessionId() {
  if (sid) return sid;
  try {
    sid = sessionStorage.getItem("mx-sid") ?? "";
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("mx-sid", sid);
    }
  } catch {
    sid = crypto.randomUUID();
  }
  return sid;
}

const post = (body: string) =>
  fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});

let ready: Promise<unknown> | null = null;

// Fire-and-forget. Later events wait for the "view" to land, so the session is created with its source and device.
// sendBeacon still delivers while the tab is closing.
export function track(type: string, data: Record<string, unknown> = {}) {
  const body = JSON.stringify({ sid: sessionId(), type, ...data });
  if (type === "view") {
    ready = post(body);
    return;
  }
  (ready ?? Promise.resolve()).then(() => {
    try {
      if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
    } catch {}
    post(body);
  });
}

// Records which fields got an answer (names only, never what was typed).
const filled = new Set<string>();
export function fieldFilled(name: string) {
  if (filled.has(name)) return;
  filled.add(name);
  track("field", { name });
}

export default function Tracker() {
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    track("view", {
      referrer: document.referrer,
      path: location.pathname + location.search,
      screen: `${screen.width}x${screen.height}`,
      lang: navigator.language,
      utm: { source: q.get("utm_source"), medium: q.get("utm_medium"), campaign: q.get("utm_campaign") },
    });

    // A section counts as seen once it crosses the middle of the screen.
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting && !seen.has(e.target.id)) {
            seen.add(e.target.id);
            track("section", { name: e.target.id });
          }
        }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    // Time on page counts only while the tab is visible.
    let active = 0;
    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let maxScroll = 0;
    const flush = () => {
      if (visibleSince) {
        active += Date.now() - visibleSince;
        visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
      }
      if (active > 0) {
        track("ping", { activeMs: Math.round(active), scroll: maxScroll });
        active = 0;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (visibleSince) active += Date.now() - visibleSince;
        visibleSince = 0;
        flush();
      } else visibleSince = Date.now();
    };
    const onScroll = () => {
      const h = document.documentElement;
      maxScroll = Math.max(maxScroll, Math.min(100, Math.round(((h.scrollTop + innerHeight) / h.scrollHeight) * 100)));
    };

    let started = false;
    const onFocus = (e: FocusEvent) => {
      if (!started && (e.target as Element).closest?.(".form")) {
        started = true;
        track("form_start");
      }
    };
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (!el.name || !el.closest?.(".form")) return;
      const has = el.type === "checkbox" || el.type === "radio" ? el.checked : el.type === "file" ? !!el.files?.length : !!el.value.trim();
      if (has) fieldFilled(el.name);
    };

    // Counts clicks on links marked data-track="name".
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[data-track]");
      if (a) track("click", { name: a.getAttribute("data-track") });
    };

    const timer = setInterval(flush, 15_000);
    document.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisibility);
    addEventListener("pagehide", flush);
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("change", onChange);
    return () => {
      flush();
      clearInterval(timer);
      document.removeEventListener("click", onClick);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("pagehide", flush);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("change", onChange);
    };
  }, []);
  return null;
}
