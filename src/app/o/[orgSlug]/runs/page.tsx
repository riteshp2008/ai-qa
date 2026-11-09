import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AutoRefresh } from "@/components/runs/auto-refresh";
import { RunList } from "@/components/runs/run-list";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { isActiveRun } from "@/domain/test-runs/types";
import { requireOrganizationPage, type OrganizationContext } from "@/server/auth/organization-context";
import { testRunService } from "@/server/services/test-run.service";

export const metadata: Metadata = { title: "Test runs" };

export default async function RunsPage({ params }: PageProps<"/o/[orgSlug]/runs">) {
  await connection();
  const { orgSlug } = await params;
  const context = await requireOrganizationPage(orgSlug);

  return (
    <>
      <PageHeader title="Test runs" description="Every run keeps its lifecycle, attempts, and evidence. Active runs refresh automatically." />
      <Card>
        <Suspense fallback={<Skeleton.List rows={6} />}>
          <Runs context={context} />
        </Suspense>
      </Card>
    </>
  );
}

async function Runs({ context }: { context: OrganizationContext }) {
  const runs = await testRunService.listForOrganization(context, { limit: 50 });
  const slug = context.organization.slug;
  return (
    <>
      <AutoRefresh active={runs.some((run) => isActiveRun(run.status))} />
      <RunList
        runs={runs}
        orgSlug={slug}
        now={new Date()}
        emptyAction={<ButtonLink href={`/o/${slug}/projects`} variant="secondary">Pick a project to test</ButtonLink>}
      />
    </>
  );
}
