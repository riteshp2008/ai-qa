"use server";

import { refresh } from "next/cache";

import type { ActionState } from "@/lib/forms/action-state";
import { formValues, runAction } from "@/server/actions/run-action";
import { requireOrganizationAccess } from "@/server/auth/organization-context";
import { inviteService } from "@/server/services/invite.service";
import { joinRequestService, type JoinDecision } from "@/server/services/join-request.service";
import { membershipService } from "@/server/services/membership.service";

export async function reviewJoinRequestAction(orgSlug: string, requestId: string, decision: JoinDecision): Promise<ActionState> {
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug, "join-requests:review");
    await joinRequestService.review(context, requestId, decision);
    refresh();
  });
}

export async function removeMemberAction(orgSlug: string, userId: string): Promise<ActionState> {
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug, "members:remove");
    await membershipService.removeMember(context, userId);
    refresh();
  });
}

export async function createInviteAction(orgSlug: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const context = await requireOrganizationAccess(orgSlug, "invites:manage");
    const { invite, inviteUrl } = await inviteService.create(context, values);
    refresh();
    return { status: "success", message: `Invitation emailed to ${invite.email}.`, data: { inviteUrl } };
  });
}

export async function revokeInviteAction(orgSlug: string, inviteId: string): Promise<ActionState> {
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug, "invites:manage");
    await inviteService.revoke(context, inviteId);
    refresh();
  });
}
