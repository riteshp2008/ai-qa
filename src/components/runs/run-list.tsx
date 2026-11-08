import Link from "next/link";

import { RunStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlayIcon } from "@/components/ui/icons";
import type { TestRunSummary } from "@/domain/test-runs/types";
import { formatRelativeTime, hostOf } from "@/lib/utils/format";

export function RunList({ runs, orgSlug, now, showProject = true, emptyAction }: {
  runs: TestRunSummary[];
  orgSlug: string;
  now: Date;
  showProject?: boolean;
  emptyAction?: React.ReactNode;
}) {
  if (runs.length === 0) {
    return (
      <EmptyState
        icon={<PlayIcon />}
        title="No test runs yet"
        description="Describe a flow in plain language and Sentinel will plan and execute it against your app."
        action={emptyAction}
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {runs.map((run) => (
        <li key={run.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm text-ink sm:line-clamp-1">{run.instruction}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
              {showProject && (
                <>
                  <Link href={`/o/${orgSlug}/projects/${run.projectId}`} className="font-medium text-ink/80 hover:text-brand-ink hover:underline">{run.projectName}</Link>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="truncate">{hostOf(run.targetUrl)}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={run.createdAt.toISOString()}>{formatRelativeTime(run.createdAt, now)}</time>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{run.id.slice(0, 8)}</span>
            </p>
          </div>
          <RunStatusBadge status={run.status} />
        </li>
      ))}
    </ul>
  );
}
