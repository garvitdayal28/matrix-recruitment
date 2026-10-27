"use client";

import { useEffect } from "react";

// Adds .is-in to .reveal elements as they scroll into view. Uses IntersectionObserver so it runs on every
// mobile browser (CSS scroll timelines are missing on older iOS Safari).
export default function Reveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        // Elements entering together get a short stagger.
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, i) => {
            const el = e.target as HTMLElement;
            el.style.transitionDelay = `${i * 80}ms`;
            el.style.setProperty("--d", `${i * 80}ms`);
            el.classList.add("is-in");
            io.unobserve(el);
          });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
