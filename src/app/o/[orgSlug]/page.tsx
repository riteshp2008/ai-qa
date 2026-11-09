import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Reveal } from "@/components/motion/reveal";
import { SetupChecklist } from "@/components/overview/setup-checklist";
import { StatCard } from "@/components/overview/stat-card";
import { RunList } from "@/components/runs/run-list";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FolderIcon, GitHubIcon, PlayIcon, PlusIcon, ShieldIcon, SparkIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { pluralize } from "@/lib/utils/format";
import { requireOrganizationPage, type OrganizationContext } from "@/server/auth/organization-context";
import { overviewService } from "@/server/services/overview.service";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({ params, searchParams }: PageProps<"/o/[orgSlug]">) {
  await connection();
  const [{ orgSlug }, query] = await Promise.all([params, searchParams]);
  const context = await requireOrganizationPage(orgSlug);
  const firstName = context.user.name?.split(" ")[0];

  return (
    <div className="grid gap-6">
      {query.welcome && <WelcomeBanner name={context.organization.name} slug={orgSlug} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{firstName ? `Welcome back, ${firstName}` : "Overview"}</h1>
          <p className="mt-1.5 text-sm text-muted">Quality signals across {context.organization.name}.</p>
        </div>
        <ButtonLink href={`/o/${orgSlug}/projects/new`} prefetch><PlusIcon /> New project</ButtonLink>
      </div>

      {/* Independent boundaries: each section streams in as soon as its own data is ready. */}
      <Suspense fallback={<Skeleton className="h-44 rounded-xl" />}>
        <SetupSection context={context} />
      </Suspense>
      <Suspense fallback={<Skeleton.Grid count={4} className="grid grid-cols-2 gap-3 lg:grid-cols-4" />}>
        <StatsSection context={context} />
      </Suspense>
      <Card aria-labelledby="recent-runs">
        <Card.Header
          id="recent-runs"
          title="Recent runs"
          description="The latest checks across every project."
          action={<ButtonLink href={`/o/${orgSlug}/runs`} prefetch variant="ghost" size="sm">View all</ButtonLink>}
        />
        <Suspense fallback={<Skeleton.List rows={4} />}>
          <RecentRunsSection context={context} />
        </Suspense>
      </Card>
    </div>
  );
}

function WelcomeBanner({ name, slug }: { name: string; slug: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand/25 bg-brand-soft px-5 py-4" role="status">
      <SparkIcon className="mt-0.5 size-5 text-brand-ink" />
      <div>
        <p className="text-sm font-semibold text-brand-ink">{name} is ready.</p>
        <p className="mt-0.5 text-[13px] text-brand-ink/80">
          Share the organization ID <code className="rounded bg-surface px-1 py-0.5 font-mono">{slug}</code> with teammates so they can request to join.
        </p>
      </div>
    </div>
  );
}

async function SetupSection({ context }: { context: OrganizationContext }) {
  const steps = await overviewService.setup(context);
  return <SetupChecklist steps={steps} orgSlug={context.organization.slug} />;
}

async function StatsSection({ context }: { context: OrganizationContext }) {
  const stats = await overviewService.stats(context);
  const { runCounts } = stats;
  const cards = [
    { label: "Projects", value: stats.projectCount, icon: <FolderIcon />, detail: pluralize(stats.memberCount, "member") },
    { label: "Repositories", value: stats.repositoryCount, icon: <GitHubIcon />, detail: "Linked from GitHub" },
    { label: "Test runs", value: runCounts.total, icon: <PlayIcon />, detail: runCounts.active ? `${runCounts.active} in progress` : "None in progress" },
    { label: "Pass rate", value: stats.passRate === null ? "—" : `${stats.passRate}%`, icon: <ShieldIcon />, detail: runCounts.needsReview ? `${runCounts.needsReview} need review` : "Nothing to review" },
  ];
  return (
    <Reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => <Reveal.Item key={card.label}><StatCard {...card} /></Reveal.Item>)}
    </Reveal>
  );
}

async function RecentRunsSection({ context }: { context: OrganizationContext }) {
  const runs = await overviewService.recentRuns(context);
  const slug = context.organization.slug;
  return (
    <RunList
      runs={runs}
      orgSlug={slug}
      now={new Date()}
      emptyAction={<ButtonLink href={`/o/${slug}/projects`} variant="secondary">Choose a project</ButtonLink>}
    />
  );
}
