import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { deleteProjectAction } from "@/app/o/[orgSlug]/projects/actions";
import { LinkRepositoryForm } from "@/components/projects/link-repository-form";
import { RepositoryList } from "@/components/projects/repository-list";
import { AutoRefresh } from "@/components/runs/auto-refresh";
import { RunList } from "@/components/runs/run-list";
import { StartRunForm } from "@/components/runs/start-run-form";
import { ActionButton } from "@/components/ui/action-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, TrashIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { AppError } from "@/domain/errors";
import { can } from "@/domain/organizations/roles";
import { isActiveRun } from "@/domain/test-runs/types";
import { requireOrganizationPage } from "@/server/auth/organization-context";
import { projectService } from "@/server/services/project.service";
import { repositoryLinkService } from "@/server/services/repository-link.service";
import { testRunService } from "@/server/services/test-run.service";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params, searchParams }: PageProps<"/o/[orgSlug]/projects/[projectId]">) {
  await connection();
  const [{ orgSlug, projectId }, query] = await Promise.all([params, searchParams]);
  const context = await requireOrganizationPage(orgSlug);
  const project = await projectService.get(context, projectId).catch((error) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });
  const [repositories, runs] = await Promise.all([
    repositoryLinkService.list(context, project.id),
    testRunService.listForOrganization(context, { projectId: project.id, limit: 20 }),
  ]);

  return (
    <>
      <AutoRefresh active={runs.some((run) => isActiveRun(run.status))} />
      <PageHeader
        eyebrow={<Link href={`/o/${orgSlug}/projects`} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeftIcon className="size-3.5" /> Projects</Link>}
        title={project.name}
        description={
          <a href={project.targetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand-ink">
            {project.targetUrl} <ExternalLinkIcon className="size-3.5" />
          </a>
        }
        actions={can(context.role, "projects:delete") ? (
          <ActionButton
            action={deleteProjectAction.bind(null, orgSlug, project.id)}
            variant="danger"
            confirm={`Delete ${project.name}? Its repositories links and run history will be removed.`}
            pendingLabel="Deleting…"
          >
            <TrashIcon /> Delete
          </ActionButton>
        ) : undefined}
      />

      {query.created && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand/25 bg-brand-soft px-5 py-4 text-sm text-brand-ink">
          <CheckIcon className="mt-0.5" />
          <p><span className="font-semibold">Project created.</span> Link its GitHub repository below, then describe your first test run.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title="Start a test run" description="Describe a user flow in plain language. Sentinel plans the steps and records evidence." />
            <CardBody className="p-5"><StartRunForm orgSlug={orgSlug} projectId={project.id} targetUrl={project.targetUrl} /></CardBody>
          </Card>
          <Card>
            <CardHeader title="Run history" description={`Most recent runs for ${project.name}.`} />
            <RunList runs={runs} orgSlug={orgSlug} now={new Date()} showProject={false} />
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="GitHub repositories" description="Source context for planning and triage." />
          <CardBody className="grid gap-5 p-5">
            {can(context.role, "repositories:link") && <LinkRepositoryForm orgSlug={orgSlug} projectId={project.id} />}
            <RepositoryList repositories={repositories} orgSlug={orgSlug} canUnlink={can(context.role, "repositories:unlink")} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
