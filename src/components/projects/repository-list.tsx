import { unlinkRepositoryAction } from "@/app/o/[orgSlug]/projects/actions";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { ExternalLinkIcon, GitBranchIcon, GitHubIcon, LockIcon, TrashIcon } from "@/components/ui/icons";
import type { LinkedRepository } from "@/domain/repositories/github";

export function RepositoryList({ repositories, orgSlug, canUnlink }: { repositories: LinkedRepository[]; orgSlug: string; canUnlink: boolean }) {
  if (repositories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center">
        <GitHubIcon className="mx-auto size-5 text-subtle" />
        <p className="mt-2 text-sm font-medium">No repositories linked</p>
        <p className="mt-0.5 text-[13px] text-muted">Linking source gives test planning context about routes, components, and recent changes.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {repositories.map((repository) => (
        <li key={repository.id} className="flex items-center gap-3 px-3.5 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-sunken"><GitHubIcon /></span>
          <div className="min-w-0 flex-1">
            <a href={repository.htmlUrl} target="_blank" rel="noreferrer" className="group inline-flex max-w-full items-center gap-1 font-mono text-[13px] font-medium hover:text-brand-ink">
              <span className="truncate">{repository.fullName}</span>
              <ExternalLinkIcon className="size-3 text-subtle group-hover:text-brand-ink" />
            </a>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><GitBranchIcon className="size-3" />{repository.defaultBranch}</span>
              {repository.description && <span className="hidden truncate sm:inline">· {repository.description}</span>}
            </p>
          </div>
          {repository.isPrivate && <Badge><LockIcon className="size-3" /> Private</Badge>}
          {canUnlink && (
            <ActionButton
              action={unlinkRepositoryAction.bind(null, orgSlug, repository.id)}
              variant="ghost"
              confirm={`Unlink ${repository.fullName} from this project?`}
              aria-label={`Unlink ${repository.fullName}`}
            >
              <TrashIcon />
            </ActionButton>
          )}
        </li>
      ))}
    </ul>
  );
}
