import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { InviteForm } from "@/components/members/invite-form";
import { InviteList } from "@/components/members/invite-list";
import { JoinRequestQueue } from "@/components/members/join-request-queue";
import { MemberList } from "@/components/members/member-list";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/domain/organizations/roles";
import { requireOrganizationPage, type OrganizationContext } from "@/server/auth/organization-context";
import { inviteService } from "@/server/services/invite.service";
import { joinRequestService } from "@/server/services/join-request.service";
import { membershipService } from "@/server/services/membership.service";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ params }: PageProps<"/o/[orgSlug]/members">) {
  await connection();
  const { orgSlug } = await params;
  const context = await requireOrganizationPage(orgSlug);
  const canReview = can(context.role, "join-requests:review");
  const canInvite = can(context.role, "invites:manage");

  return (
    <>
      <PageHeader title="Members" description="People in this organization can access all of its projects, repositories, and runs." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="grid content-start gap-6">
          {canReview && (
            <Suspense fallback={null}>
              <JoinRequests context={context} />
            </Suspense>
          )}
          <Card>
            <Suspense fallback={<Skeleton.List rows={4} />}>
              <Members context={context} />
            </Suspense>
            {canInvite && (
              <Suspense fallback={null}>
                <PendingInvites context={context} />
              </Suspense>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          {canInvite && (
            <Card>
              <Card.Header title="Invite by email" description="We'll email a single-use link that expires in 7 days." />
              <Card.Body className="p-5"><InviteForm orgSlug={orgSlug} /></Card.Body>
            </Card>
          )}
          <Card>
            <Card.Header title="Organization ID" description="Teammates can request to join with this ID from their onboarding screen." />
            <Card.Body className="flex items-center gap-2 p-5">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface-muted px-3 py-2 font-mono text-sm">{orgSlug}</code>
              <CopyButton value={orgSlug} size="md" />
            </Card.Body>
            {!canReview && <Card.Footer className="justify-start text-xs text-muted">Owners and admins review join requests.</Card.Footer>}
          </Card>
        </div>
      </div>
    </>
  );
}

async function JoinRequests({ context }: { context: OrganizationContext }) {
  const requests = await joinRequestService.listPending(context);
  return <JoinRequestQueue requests={requests} orgSlug={context.organization.slug} now={new Date()} />;
}

async function Members({ context }: { context: OrganizationContext }) {
  const members = await membershipService.listMembers(context);
  return (
    <>
      <Card.Header title={`Members · ${members.length}`} />
      <MemberList members={members} orgSlug={context.organization.slug} currentUserId={context.user.id} viewerRole={context.role} canRemove={can(context.role, "members:remove")} />
    </>
  );
}

async function PendingInvites({ context }: { context: OrganizationContext }) {
  const invites = await inviteService.listPending(context);
  return <InviteList invites={invites} orgSlug={context.organization.slug} now={new Date()} />;
}
