import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

import { AppShell, AppShellSkeleton } from "@/components/shell/app-shell";
import { privatePageMetadata } from "@/lib/seo/site";
import { requireOrganizationPage } from "@/server/auth/organization-context";
import { organizationService } from "@/server/services/organization.service";
import { overviewService } from "@/server/services/overview.service";

export const metadata: Metadata = privatePageMetadata;

export default function OrganizationLayout({ children, params }: LayoutProps<"/o/[orgSlug]">) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <OrganizationShell params={params}>{children}</OrganizationShell>
    </Suspense>
  );
}

async function OrganizationShell({ params, children }: { params: Promise<{ orgSlug: string }>; children: React.ReactNode }) {
  await connection();
  const { orgSlug } = await params;
  const context = await requireOrganizationPage(orgSlug);
  const [memberships, pendingRequests] = await Promise.all([
    organizationService.listForUser(context.user.id),
    overviewService.pendingJoinRequests(context),
  ]);

  return (
    <AppShell user={context.user} organization={context.organization} memberships={memberships} pendingRequests={pendingRequests}>
      {children}
    </AppShell>
  );
}
