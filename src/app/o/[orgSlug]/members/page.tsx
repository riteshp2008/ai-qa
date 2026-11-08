import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { InviteForm } from "@/components/members/invite-form";
import { InviteList } from "@/components/members/invite-list";
import { JoinRequestQueue } from "@/components/members/join-request-queue";
import { MemberList } from "@/components/members/member-list";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { can } from "@/domain/organizations/roles";
import { requireOrganizationPage } from "@/server/auth/organization-context";
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
  const [members, requests, invites] = await Promise.all([
    membershipService.listMembers(context),
    canReview ? joinRequestService.listPending(context) : [],
    canInvite ? inviteService.listPending(context) : [],
  ]);
  const now = new Date();

  return (
    <>
      <PageHeader title="Members" description="People in this organization can access all of its projects, repositories, and runs." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="grid content-start gap-6">
          <JoinRequestQueue requests={requests} orgSlug={orgSlug} now={now} />
          <Card>
            <CardHeader title={`Members · ${members.length}`} />
            <MemberList members={members} orgSlug={orgSlug} currentUserId={context.user.id} viewerRole={context.role} canRemove={can(context.role, "members:remove")} />
            {canInvite && <InviteList invites={invites} orgSlug={orgSlug} now={now} />}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          {canInvite && (
            <Card>
              <CardHeader title="Invite by email" description="We'll email a single-use link that expires in 7 days." />
              <CardBody className="p-5"><InviteForm orgSlug={orgSlug} /></CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Organization ID" description="Teammates can request to join with this ID from their onboarding screen." />
            <CardBody className="flex items-center gap-2 p-5">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface-muted px-3 py-2 font-mono text-sm">{context.organization.slug}</code>
              <CopyButton value={context.organization.slug} size="md" />
            </CardBody>
            {!canReview && <p className="px-5 pb-5 text-xs text-muted">Owners and admins review requests. <Link href={`/o/${orgSlug}/settings`} className="underline">Settings</Link></p>}
          </Card>
        </div>
      </div>
    </>
  );
}
