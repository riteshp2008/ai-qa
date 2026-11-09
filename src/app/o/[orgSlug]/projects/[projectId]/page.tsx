import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { deleteProjectAction } from "@/app/o/[orgSlug]/projects/actions";
import { PipelineLauncher } from "@/components/pipelines/pipeline-launcher";
import { PipelineList } from "@/components/pipelines/pipeline-list";
import { ProjectJourney, type JourneyStep } from "@/components/pipelines/project-journey";
import { LinkRepositoryForm } from "@/components/projects/link-repository-form";
import { RepositoryList } from "@/components/projects/repository-list";
import { AutoRefresh } from "@/components/runs/auto-refresh";
import { RunList } from "@/components/runs/run-list";
import { StartRunForm } from "@/components/runs/start-run-form";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, GitHubIcon, SparkIcon, TrashIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AppError } from "@/domain/errors";
import { can } from "@/domain/organizations/roles";
import { isActive } from "@/domain/pipelines/lifecycle";
import type { Project } from "@/domain/projects/types";
import { isActiveRun } from "@/domain/test-runs/types";
import { requireOrganizationPage, type OrganizationContext } from "@/server/auth/organization-context";
import { pipelineService } from "@/server/services/pipeline.service";
import { projectService } from "@/server/services/project.service";
import { repositoryLinkService } from "@/server/services/repository-link.service";
import { testRunService } from "@/server/services/test-run.service";

export async function generateMetadata({ params }: PageProps<"/o/[orgSlug]/projects/[projectId]">): Promise<Metadata> {
  const { orgSlug, projectId } = await params;
  const context = await requireOrganizationPage(orgSlug);
  const project = await projectService.get(context, projectId).catch(() => null);
  return { title: project ? `${project.name} · ${context.organization.name}` : "Project" };
}

export default async function ProjectPage({ params, searchParams }: PageProps<"/o/[orgSlug]/projects/[projectId]">) {
  await connection();
  const [{ orgSlug, projectId }, query] = await Promise.all([params, searchParams]);
  const context = await requireOrganizationPage(orgSlug);
  const project = await projectService.get(context, projectId).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });
  // Repositories and pipelines drive the guided journey, so they load with the page shell.
  const [repositories, pipelines] = await Promise.all([
    repositoryLinkService.list(context, project.id),
    pipelineService.list(context, project.id),
  ]);

  const journey: JourneyStep[] = [
    { key: "organization", label: "Organization", done: true },
    { key: "project", label: "Project", done: true },
    { key: "repository", label: "GitHub repo", done: repositories.length > 0, href: "#repositories" },
    { key: "pipeline", label: "AI tests", done: pipelines.length > 0, href: "#ai-tests" },
    { key: "pr", label: "Pull request", done: pipelines.some((pipeline) => pipeline.prUrl) },
  ];

  return (
    <>
      <AutoRefresh active={pipelines.some((pipeline) => isActive(pipeline.status))} />
      <PageHeader
        eyebrow={<Link href={`/o/${orgSlug}/projects`} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeftIcon className="size-3.5" /> Projects</Link>}
        title={project.name}
        description={
          <a href={project.targetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all hover:text-brand-ink">
            {project.targetUrl} <ExternalLinkIcon className="size-3.5 shrink-0" />
          </a>
        }
        actions={can(context.role, "projects:delete") ? (
          <ActionButton
            action={deleteProjectAction.bind(null, orgSlug, project.id)}
            variant="danger"
            confirm={`Delete ${project.name}? Its repository links, pipelines, and run history will be removed.`}
            pendingLabel="Deleting…"
          >
            <TrashIcon /> Delete
          </ActionButton>
        ) : undefined}
      />

      <ProjectJourney steps={journey} />

      {query.created && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand/25 bg-brand-soft px-5 py-4 text-sm text-brand-ink" role="status">
          <CheckIcon className="mt-0.5" />
          <p><span className="font-semibold">Project created.</span> Next, link its GitHub repository so the agents can read the code.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="grid content-start gap-6">
          <Card id="ai-tests" className="scroll-mt-24">
            <Card.Header
              title={<span className="flex items-center gap-2"><SparkIcon className="text-brand" /> AI test pipeline</span>}
              description="Agents run your repo in a Docker sandbox, write E2E, API, and unit tests, verify them, and open a pull request after your approval."
            />
            <Card.Body className="p-5">
              {repositories.length === 0 ? (
                <EmptyState
                  className="py-6"
                  icon={<GitHubIcon />}
                  title="Link a repository first"
                  description="The agents need the source code to containerize the app and write tests."
                />
              ) : can(context.role, "pipelines:run") ? (
                <PipelineLauncher orgSlug={orgSlug} projectId={project.id} repositories={repositories} />
              ) : (
                <p className="text-sm text-muted">You don&apos;t have permission to start pipelines.</p>
              )}
            </Card.Body>
            {pipelines.length > 0 && (
              <div className="border-t border-line">
                <p className="px-5 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-subtle">Recent pipelines</p>
                <PipelineList pipelines={pipelines} orgSlug={orgSlug} now={new Date()} />
              </div>
            )}
          </Card>

          <Card>
            <Card.Header title="Quick check" description="Ask Sentinel to verify one flow against the deployed URL, without changing the repository." />
            <Card.Body className="p-5"><StartRunForm orgSlug={orgSlug} projectId={project.id} targetUrl={project.targetUrl} /></Card.Body>
          </Card>
          <Card>
            <Card.Header title="Run history" description={`Most recent checks for ${project.name}.`} />
            <Suspense fallback={<Skeleton.List rows={3} />}>
              <RunHistory context={context} project={project} />
            </Suspense>
          </Card>
        </div>

        <Card id="repositories" className="scroll-mt-24 self-start">
          <Card.Header title="GitHub repositories" description="Source the agents read, containerize, and open pull requests against." />
          <Card.Body className="grid gap-5 p-5">
            {can(context.role, "repositories:link") && <LinkRepositoryForm orgSlug={orgSlug} projectId={project.id} />}
            <RepositoryList repositories={repositories} orgSlug={orgSlug} canUnlink={can(context.role, "repositories:unlink")} />
          </Card.Body>
        </Card>
      </div>
    </>
  );
}

async function RunHistory({ context, project }: { context: OrganizationContext; project: Project }) {
  const runs = await testRunService.listForOrganization(context, { projectId: project.id, limit: 20 });
  return (
    <>
      <AutoRefresh active={runs.some((run) => isActiveRun(run.status))} />
      <RunList runs={runs} orgSlug={context.organization.slug} now={new Date()} showProject={false} />
    </>
  );
}
