"use client";

import { useEffect } from "react";

import { useLatest } from "./use-latest";

/** Calls `handler` when Escape is pressed while `enabled`. */
export function useEscapeKey(handler: () => void, enabled = true) {
  const handlerRef = useLatest(handler);
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handlerRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, handlerRef]);
}
