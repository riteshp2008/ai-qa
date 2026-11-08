"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches server data on an interval while there is something in flight. */
export function AutoRefresh({ active, intervalMs = 8000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs, router]);
  return null;
}
