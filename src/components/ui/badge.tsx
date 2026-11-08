import type { ReactNode } from "react";

import type { OrganizationRole } from "@/domain/organizations/roles";
import { roleLabel } from "@/domain/organizations/roles";
import type { TestRunStatus } from "@/domain/test-runs/lifecycle";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-muted",
  brand: "bg-brand-soft text-brand-ink",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/12 text-red-700 dark:text-red-300",
  info: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
};

export function Badge({ tone = "neutral", dot, children, className }: { tone?: BadgeTone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

const runStatus: Record<TestRunStatus, { tone: BadgeTone; label: string }> = {
  queued: { tone: "info", label: "Queued" },
  running: { tone: "info", label: "Running" },
  retry_wait: { tone: "warning", label: "Retrying" },
  passed: { tone: "success", label: "Passed" },
  failed: { tone: "danger", label: "Failed" },
  needs_review: { tone: "warning", label: "Needs review" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export function RunStatusBadge({ status }: { status: string }) {
  const config = runStatus[status as TestRunStatus] ?? { tone: "neutral" as const, label: status };
  return <Badge tone={config.tone} dot>{config.label}</Badge>;
}

export function RoleBadge({ role }: { role: OrganizationRole }) {
  return <Badge tone={role === "owner" ? "brand" : role === "admin" ? "info" : "neutral"}>{roleLabel(role)}</Badge>;
}
