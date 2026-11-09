import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderIcon, PlusIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOrganizationPage, type OrganizationContext } from "@/server/auth/organization-context";
import { projectService } from "@/server/services/project.service";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ params }: PageProps<"/o/[orgSlug]/projects">) {
  await connection();
  const { orgSlug } = await params;
  const context = await requireOrganizationPage(orgSlug);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project is an authorized application, with its GitHub repositories and test runs."
        actions={<ButtonLink href={`/o/${orgSlug}/projects/new`} prefetch><PlusIcon /> New project</ButtonLink>}
      />
      <Suspense fallback={<Skeleton.Grid count={3} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" itemClassName="h-36" />}>
        <ProjectGrid context={context} />
      </Suspense>
    </>
  );
}

async function ProjectGrid({ context }: { context: OrganizationContext }) {
  const projects = await projectService.list(context);
  const slug = context.organization.slug;

  if (projects.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<FolderIcon />}
          title="Create your first project"
          description="Register a web application your team owns. Runs are restricted to its origin, so tests never wander off-target."
          action={<ButtonLink href={`/o/${slug}/projects/new`}><PlusIcon /> New project</ButtonLink>}
        />
      </Card>
    );
  }

  const now = new Date();
  return (
    <Reveal as="ul" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Reveal.Item as="li" key={project.id}>
          <ProjectCard project={project} orgSlug={slug} now={now} />
        </Reveal.Item>
      ))}
    </Reveal>
  );
}
