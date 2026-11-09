"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Copies text and exposes a transient `copied` flag. Timers are cleared on unmount. */
export function useCopyToClipboard(resetAfterMs = 1600) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), resetAfterMs);
      return true;
    } catch {
      setCopied(false);
      return false;
    }
  }, [resetAfterMs]);

  return { copied, copy };
}
