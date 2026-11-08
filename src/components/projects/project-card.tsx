import Link from "next/link";

import { RunStatusBadge } from "@/components/ui/badge";
import { GitHubIcon, GlobeIcon, PlayIcon } from "@/components/ui/icons";
import type { ProjectSummary } from "@/domain/projects/types";
import { formatRelativeTime, hostOf, pluralize } from "@/lib/utils/format";

export function ProjectCard({ project, orgSlug, now }: { project: ProjectSummary; orgSlug: string; now: Date }) {
  return (
    <Link
      href={`/o/${orgSlug}/projects/${project.id}`}
      className="group flex flex-col rounded-xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold group-hover:text-brand-ink">{project.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-muted"><GlobeIcon className="size-3.5 shrink-0" />{hostOf(project.targetUrl)}</p>
        </div>
        {project.lastRunStatus && <RunStatusBadge status={project.lastRunStatus} />}
      </div>
      <div className="mt-5 flex items-center gap-4 border-t border-line pt-3.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><GitHubIcon className="size-3.5" />{pluralize(project.repositoryCount, "repo")}</span>
        <span className="inline-flex items-center gap-1.5"><PlayIcon className="size-3.5" />{pluralize(project.runCount, "run")}</span>
        <span className="ml-auto">{project.lastRunAt ? `Last run ${formatRelativeTime(project.lastRunAt, now)}` : "No runs yet"}</span>
      </div>
    </Link>
  );
}
