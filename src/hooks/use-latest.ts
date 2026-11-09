"use client";

import { useInsertionEffect, useRef } from "react";

/**
 * Keeps a ref pointing at the latest value so effects and timers can call the
 * newest callback without re-subscribing on every render.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useInsertionEffect(() => {
    ref.current = value;
  });
  return ref;
}
