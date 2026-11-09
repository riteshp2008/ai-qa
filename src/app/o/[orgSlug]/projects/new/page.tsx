import type { Metadata } from "next";
import Link from "next/link";

import { CreateProjectForm } from "@/components/projects/create-project-form";
import { Card } from "@/components/ui/card";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage({ params }: PageProps<"/o/[orgSlug]/projects/new">) {
  const { orgSlug } = await params;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={<Link href={`/o/${orgSlug}/projects`} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeftIcon className="size-3.5" /> Projects</Link>}
        title="New project"
        description="Register an application to test. Next, you'll link its GitHub repositories and start runs."
      />
      <Card><Card.Body className="p-6"><CreateProjectForm orgSlug={orgSlug} /></Card.Body></Card>
    </div>
  );
}
