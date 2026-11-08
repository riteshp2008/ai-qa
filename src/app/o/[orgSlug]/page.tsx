import { connection } from "next/server";

import { RunList } from "@/components/runs/run-list";
import { SetupChecklist } from "@/components/overview/setup-checklist";
import { StatCard } from "@/components/overview/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FolderIcon, GitHubIcon, PlayIcon, PlusIcon, ShieldIcon, SparkIcon } from "@/components/ui/icons";
import { requireOrganizationPage } from "@/server/auth/organization-context";
import { overviewService } from "@/server/services/overview.service";

export default async function OverviewPage({ params, searchParams }: PageProps<"/o/[orgSlug]">) {
  await connection();
  const [{ orgSlug }, query] = await Promise.all([params, searchParams]);
  const context = await requireOrganizationPage(orgSlug);
  const overview = await overviewService.get(context);
  const { runCounts } = overview;
  const completed = runCounts.passed + runCounts.failed;
  const passRate = completed ? Math.round((runCounts.passed / completed) * 100) : null;
  const firstName = context.user.name?.split(" ")[0];

  return (
    <div className="grid gap-6">
      {query.welcome && (
        <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand-soft px-5 py-4">
          <SparkIcon className="mt-0.5 size-5 text-brand-ink" />
          <div>
            <p className="text-sm font-semibold text-brand-ink">{context.organization.name} is ready.</p>
            <p className="mt-0.5 text-[13px] text-brand-ink/80">
              Share the organization ID <code className="rounded bg-surface px-1 py-0.5 font-mono">{context.organization.slug}</code> with teammates so they can request to join.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{firstName ? `Welcome back, ${firstName}` : "Overview"}</h1>
          <p className="mt-1.5 text-sm text-muted">Quality signals across {context.organization.name}.</p>
        </div>
        <ButtonLink href={`/o/${orgSlug}/projects/new`}><PlusIcon /> New project</ButtonLink>
      </div>

      <SetupChecklist steps={overview.setup} orgSlug={orgSlug} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Projects" value={overview.projectCount} icon={<FolderIcon />} detail={`${overview.memberCount} member${overview.memberCount === 1 ? "" : "s"}`} />
        <StatCard label="Repositories" value={overview.repositoryCount} icon={<GitHubIcon />} detail="Linked from GitHub" />
        <StatCard label="Test runs" value={runCounts.total} icon={<PlayIcon />} detail={runCounts.active ? `${runCounts.active} in progress` : "None in progress"} />
        <StatCard label="Pass rate" value={passRate === null ? "—" : `${passRate}%`} icon={<ShieldIcon />} detail={runCounts.needsReview ? `${runCounts.needsReview} need review` : "Nothing to review"} />
      </div>

      <Card>
        <CardHeader
          title="Recent runs"
          description="The latest checks across every project."
          action={<ButtonLink href={`/o/${orgSlug}/runs`} variant="ghost" size="sm">View all</ButtonLink>}
        />
        <RunList
          runs={overview.recentRuns}
          orgSlug={orgSlug}
          now={new Date()}
          emptyAction={<ButtonLink href={`/o/${orgSlug}/projects`} variant="secondary">Choose a project</ButtonLink>}
        />
      </Card>
    </div>
  );
}
