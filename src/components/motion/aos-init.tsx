"use client";

import "aos/dist/aos.css";

import { useEffect } from "react";

/**
 * Initializes AOS (animate-on-scroll) for marketing pages. The library is
 * imported lazily after hydration so it never blocks first paint, and it is
 * disabled for people who prefer reduced motion (AOS then strips its
 * attributes, leaving content fully visible).
 */
export function AosInit() {
  useEffect(() => {
    let cancelled = false;
    void import("aos").then(({ default: AOS }) => {
      if (cancelled) return;
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
        disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
