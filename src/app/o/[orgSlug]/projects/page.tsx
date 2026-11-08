import type { Metadata } from "next";
import { connection } from "next/server";

import { ProjectCard } from "@/components/projects/project-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderIcon, PlusIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPage } from "@/server/auth/organization-context";
import { projectService } from "@/server/services/project.service";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ params }: PageProps<"/o/[orgSlug]/projects">) {
  await connection();
  const { orgSlug } = await params;
  const context = await requireOrganizationPage(orgSlug);
  const projects = await projectService.list(context);
  const now = new Date();
  const newProject = <ButtonLink href={`/o/${orgSlug}/projects/new`}><PlusIcon /> New project</ButtonLink>;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project is an authorized application, with its GitHub repositories and test runs."
        actions={projects.length > 0 ? newProject : undefined}
      />
      {projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderIcon />}
            title="Create your first project"
            description="Register a web application your team owns. Runs are restricted to its origin, so tests never wander off-target."
            action={newProject}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project.id} project={project} orgSlug={orgSlug} now={now} />)}
        </div>
      )}
    </>
  );
}
