"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useVisibleInterval } from "@/hooks/use-visible-interval";

/** Re-fetches server data while runs are in flight; pauses when the tab is hidden. */
export function AutoRefresh({ active, intervalMs = 8000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  useVisibleInterval(refresh, intervalMs, active);
  return null;
}
