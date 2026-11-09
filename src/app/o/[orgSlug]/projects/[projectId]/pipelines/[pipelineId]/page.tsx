import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { cancelPipelineAction } from "@/app/o/[orgSlug]/projects/[projectId]/pipelines/actions";
import { ApprovalPanel } from "@/components/pipelines/approval-panel";
import { EnvironmentPanel } from "@/components/pipelines/environment-panel";
import { PipelineStatusBadge } from "@/components/pipelines/pipeline-status-badge";
import { PipelineStepper } from "@/components/pipelines/pipeline-stepper";
import { PipelineTimeline } from "@/components/pipelines/pipeline-timeline";
import { SuiteResults } from "@/components/pipelines/suite-results";
import { AutoRefresh } from "@/components/runs/auto-refresh";
import { ActionButton } from "@/components/ui/action-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertIcon, ArrowLeftIcon, GitHubIcon, ShieldIcon, XIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AppError } from "@/domain/errors";
import { can } from "@/domain/organizations/roles";
import { isActive, isTerminal } from "@/domain/pipelines/lifecycle";
import type { Pipeline, PipelineStatus } from "@/domain/pipelines/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { requireOrganizationPage, type OrganizationContext } from "@/server/auth/organization-context";
import { pipelineService } from "@/server/services/pipeline.service";

// The file viewer is interactive and only needed below the fold: split it into its own chunk.
const ArtifactViewer = dynamic(() => import("@/components/pipelines/artifact-viewer"), {
  loading: () => <Skeleton className="m-5 h-72" />,
});

export const metadata: Metadata = { title: "AI test pipeline" };

/** Best guess at the stage a stopped pipeline reached, for the stepper. */
function lastStage(pipeline: Pipeline): PipelineStatus {
  if (pipeline.prUrl) return "creating_pr";
  if (pipeline.results.suites) return "verifying";
  if (pipeline.results.container) return pipeline.results.container.status === "running" ? "generating" : "containerizing";
  return pipeline.appProfile ? "analyzing" : "provisioning";
}

function approvalWarnings(pipeline: Pipeline): string[] {
  const warnings: string[] = [];
  for (const [suite, result] of Object.entries(pipeline.results.suites ?? {})) {
    if (!result) continue;
    if (result.status === "failed" || result.status === "partial") warnings.push(`${suite.toUpperCase()} suite has ${result.failed} failing test(s); the PR will open as a draft.`);
    if (result.status === "blocked") warnings.push(`${suite.toUpperCase()} suite was skipped because the app could not start.`);
    if (result.suspectedBugs.length) warnings.push(`${suite.toUpperCase()} agent suspects ${result.suspectedBugs.length} application bug(s).`);
  }
  if (pipeline.results.review?.verdict === "revise") warnings.push("The reviewer agent still had concerns after the maximum revision rounds.");
  if (pipeline.results.guardrails?.revertedPaths.length) warnings.push(`${pipeline.results.guardrails.revertedPaths.length} out-of-scope change(s) were excluded by guardrails.`);
  return warnings;
}

export default async function PipelinePage({ params }: PageProps<"/o/[orgSlug]/projects/[projectId]/pipelines/[pipelineId]">) {
  await connection();
  const { orgSlug, projectId, pipelineId } = await params;
  const context = await requireOrganizationPage(orgSlug);
  const pipeline = await pipelineService.get(context, pipelineId).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });
  if (pipeline.projectId !== projectId) notFound();

  const now = new Date();
  const container = pipeline.results.container;

  return (
    <>
      <AutoRefresh active={isActive(pipeline.status)} intervalMs={5000} />
      <PageHeader
        eyebrow={<Link href={`/o/${orgSlug}/projects/${projectId}`} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeftIcon className="size-3.5" /> Project</Link>}
        title={<span className="flex flex-wrap items-center gap-3">AI test pipeline <PipelineStatusBadge status={pipeline.status} /></span>}
        description={<span className="inline-flex items-center gap-1.5 font-mono"><GitHubIcon className="size-3.5" />{pipeline.repositoryFullName} · started {formatRelativeTime(pipeline.createdAt, now)}</span>}
        actions={
          <>
            {pipeline.prUrl && <ButtonLink href={pipeline.prUrl} target="_blank" rel="noreferrer"><GitHubIcon /> View PR #{pipeline.prNumber}</ButtonLink>}
            {!isTerminal(pipeline.status) && can(context.role, "pipelines:cancel") && (
              <ActionButton action={cancelPipelineAction.bind(null, orgSlug, pipeline.id)} variant="ghost" confirm="Cancel this pipeline? The sandbox will be destroyed." pendingLabel="Cancelling…">
                <XIcon /> Cancel
              </ActionButton>
            )}
          </>
        }
      />

      <div className="grid gap-6">
        <Card><Card.Body className="p-5"><PipelineStepper status={pipeline.status} lastActiveStage={lastStage(pipeline)} /></Card.Body></Card>

        {pipeline.status === "failed" && pipeline.error && (
          <div role="alert" className="flex gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger">
            <AlertIcon className="mt-0.5 shrink-0" />
            <div><p className="font-semibold">The pipeline stopped</p><p className="mt-0.5">{pipeline.error}</p></div>
          </div>
        )}

        {pipeline.status === "awaiting_input" && (
          <EnvironmentPanel orgSlug={orgSlug} pipelineId={pipeline.id} missingEnv={container?.missingEnv ?? []} />
        )}

        {pipeline.status === "awaiting_approval" && (
          <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
            <Approval context={context} pipeline={pipeline} />
          </Suspense>
        )}

        <section aria-labelledby="results-heading" className="grid gap-3">
          <h2 id="results-heading" className="text-[15px] font-semibold">Verified results</h2>
          <SuiteResults results={pipeline.results} suites={pipeline.suites} />
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            {pipeline.appProfile && <span className="rounded-full bg-surface-sunken px-2.5 py-1">Stack: {pipeline.appProfile.stack}</span>}
            {container && <span className="rounded-full bg-surface-sunken px-2.5 py-1">Container: {container.status}{container.createdDockerfile ? " · Dockerfile written by agent" : ""}</span>}
            {pipeline.results.guardrails && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1">
                <ShieldIcon className="size-3" /> {pipeline.results.guardrails.blockedActions} blocked action(s) · {pipeline.results.guardrails.revertedPaths.length} excluded file(s)
              </span>
            )}
            {pipeline.reviewRound > 0 && <span className="rounded-full bg-surface-sunken px-2.5 py-1">Human revision round {pipeline.reviewRound}</span>}
          </div>
          {pipeline.results.review && (
            <p className="rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-muted">
              <span className="font-medium text-ink">Reviewer agent:</span> {pipeline.results.review.summary}
            </p>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card>
            <Card.Header title="Agent activity" description="Stages, tool calls, guardrail interventions, and human decisions." />
            <Suspense fallback={<Skeleton.List rows={5} />}>
              <Timeline context={context} pipelineId={pipeline.id} />
            </Suspense>
          </Card>
          <Card>
            <Card.Header title="Generated files" description="Exactly what will be committed to the pull request." />
            <Suspense fallback={<Skeleton className="m-5 h-72" />}>
              <Artifacts context={context} pipelineId={pipeline.id} />
            </Suspense>
          </Card>
        </div>
      </div>
    </>
  );
}

async function Approval({ context, pipeline }: { context: OrganizationContext; pipeline: Pipeline }) {
  const artifacts = await pipelineService.artifacts(context, pipeline.id);
  return (
    <ApprovalPanel
      orgSlug={context.organization.slug}
      pipelineId={pipeline.id}
      canApprove={can(context.role, "pipelines:approve")}
      warnings={approvalWarnings(pipeline)}
      fileCount={artifacts.length}
    />
  );
}

async function Timeline({ context, pipelineId }: { context: OrganizationContext; pipelineId: string }) {
  const events = await pipelineService.timeline(context, pipelineId);
  return <PipelineTimeline events={events} />;
}

async function Artifacts({ context, pipelineId }: { context: OrganizationContext; pipelineId: string }) {
  const artifacts = await pipelineService.artifacts(context, pipelineId);
  return <ArtifactViewer artifacts={artifacts} />;
}
