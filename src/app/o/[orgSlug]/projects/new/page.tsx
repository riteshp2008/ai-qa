import type { Metadata } from "next";
import Link from "next/link";

import { ProjectJourney } from "@/components/pipelines/project-journey";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { Card } from "@/components/ui/card";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage({ params, searchParams }: PageProps<"/o/[orgSlug]/projects/new">) {
  const [{ orgSlug }, query] = await Promise.all([params, searchParams]);
  return (
    <div className="mx-auto max-w-2xl">
      <ProjectJourney
        steps={[
          { key: "organization", label: "Organization", done: true },
          { key: "project", label: "Project", done: false },
          { key: "repository", label: "GitHub repo", done: false },
          { key: "pipeline", label: "AI tests", done: false },
          { key: "pr", label: "Pull request", done: false },
        ]}
      />
      {query.welcome && (
        <p className="mb-6 rounded-xl border border-brand/25 bg-brand-soft px-5 py-4 text-sm text-brand-ink" role="status">
          <span className="font-semibold">Your organization is ready.</span> Register the application you want to test — next you&apos;ll link its GitHub repository.
        </p>
      )}
      <PageHeader
        eyebrow={<Link href={`/o/${orgSlug}/projects`} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeftIcon className="size-3.5" /> Projects</Link>}
        title="New project"
        description="Register an application to test. Next, you'll link its GitHub repositories and start runs."
      />
      <Card><Card.Body className="p-6"><CreateProjectForm orgSlug={orgSlug} /></Card.Body></Card>
    </div>
  );
}
