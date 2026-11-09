import type { Metadata } from "next";
import { connection } from "next/server";

import { leaveOrganizationAction } from "@/app/o/[orgSlug]/settings/actions";
import { RenameOrganizationForm } from "@/components/settings/rename-organization-form";
import { ActionButton } from "@/components/ui/action-button";
import { RoleBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/domain/organizations/roles";
import { requireOrganizationPage } from "@/server/auth/organization-context";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: PageProps<"/o/[orgSlug]/settings">) {
  await connection();
  const { orgSlug } = await params;
  const context = await requireOrganizationPage(orgSlug);
  const { organization } = context;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Manage this organization and your membership." />
      <div className="grid gap-6">
        <Card>
          <Card.Header title="General" />
          <Card.Body className="grid gap-6 p-5">
            {can(context.role, "organization:update") ? (
              <RenameOrganizationForm orgSlug={orgSlug} name={organization.name} />
            ) : (
              <div><p className="text-[13px] font-medium">Organization name</p><p className="mt-1 text-sm text-muted">{organization.name}</p></div>
            )}
            <div className="grid gap-1.5">
              <p className="text-[13px] font-medium">Organization ID</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface-muted px-3 py-2 font-mono text-sm">{organization.slug}</code>
                <CopyButton value={organization.slug} size="md" />
              </div>
              <p className="text-[13px] text-muted">Share it with teammates so they can request to join. IDs are permanent.</p>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Your membership" />
          <Card.Body className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-2 text-sm">Signed in as <span className="font-medium">{context.user.email}</span> <RoleBadge role={context.role} /></div>
          </Card.Body>
        </Card>

        <Card className="border-danger/30">
          <Card.Header title="Leave organization" description="You'll lose access to its projects and runs until you're invited again." />
          <Card.Body className="p-5">
            <ActionButton
              action={leaveOrganizationAction.bind(null, orgSlug)}
              variant="danger"
              size="md"
              confirm={`Leave ${organization.name}?`}
              pendingLabel="Leaving…"
            >
              Leave {organization.name}
            </ActionButton>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
