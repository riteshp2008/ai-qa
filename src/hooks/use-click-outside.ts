"use client";

import { useEffect, type RefObject } from "react";

import { useLatest } from "./use-latest";

/** Calls `handler` on pointer-down outside every element in `refs` while `enabled`. */
export function useClickOutside(refs: ReadonlyArray<RefObject<HTMLElement | null>>, handler: () => void, enabled = true) {
  const handlerRef = useLatest(handler);
  const refsRef = useLatest(refs);
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (refsRef.current.every((ref) => !ref.current?.contains(target))) handlerRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [enabled, handlerRef, refsRef]);
}
