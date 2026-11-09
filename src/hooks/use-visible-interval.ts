"use client";

import { useEffect } from "react";

import { useLatest } from "./use-latest";

/**
 * Runs `callback` every `intervalMs` while `enabled` and the tab is visible.
 * Fires once immediately when the tab becomes visible again, so data is fresh
 * when the user returns.
 */
export function useVisibleInterval(callback: () => void, intervalMs: number, enabled = true) {
  const callbackRef = useLatest(callback);
  useEffect(() => {
    if (!enabled) return;
    let id: number | undefined;
    const start = () => {
      window.clearInterval(id);
      id = window.setInterval(() => callbackRef.current(), intervalMs);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        callbackRef.current();
        start();
      } else {
        window.clearInterval(id);
      }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs, callbackRef]);
}
