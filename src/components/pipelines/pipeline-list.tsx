import Link from "next/link";

import { ExternalLinkIcon, GitHubIcon } from "@/components/ui/icons";
import type { Pipeline } from "@/domain/pipelines/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { PipelineStatusBadge } from "./pipeline-status-badge";

export function PipelineList({ pipelines, orgSlug, now }: { pipelines: Pipeline[]; orgSlug: string; now: Date }) {
  if (pipelines.length === 0) return <p className="px-5 py-6 text-center text-sm text-muted">No pipelines yet.</p>;
  return (
    <ul className="divide-y divide-line">
      {pipelines.map((pipeline) => (
        <li key={pipeline.id}>
          <Link
            href={`/o/${orgSlug}/projects/${pipeline.projectId}/pipelines/${pipeline.id}`}
            prefetch
            className="flex flex-col gap-2 px-5 py-3.5 transition hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-mono text-[13px] font-medium"><GitHubIcon className="size-3.5 shrink-0" />{pipeline.repositoryFullName}</p>
              <p className="mt-0.5 text-xs text-muted">
                {pipeline.suites.map((suite) => suite.toUpperCase()).join(" · ")} · {formatRelativeTime(pipeline.createdAt, now)}
                {pipeline.prNumber && <span className="ml-1.5 inline-flex items-center gap-0.5 text-brand-ink">PR #{pipeline.prNumber}<ExternalLinkIcon className="size-3" /></span>}
              </p>
            </div>
            <PipelineStatusBadge status={pipeline.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
