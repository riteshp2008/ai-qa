"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/forms/action-state";
import { formValues, runAction } from "@/server/actions/run-action";
import { requireActionUser } from "@/server/auth/session";
import { joinRequestService } from "@/server/services/join-request.service";
import { organizationService } from "@/server/services/organization.service";

export async function createOrganizationAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const user = await requireActionUser();
    const organization = await organizationService.create(user, values);
    redirect(`/o/${organization.slug}?welcome=1`);
  });
}

export async function requestToJoinAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const user = await requireActionUser();
    const { organization, created } = await joinRequestService.request(user, values);
    refresh();
    return {
      status: "success",
      message: created
        ? `Request sent to ${organization.name}. Its admins have been emailed, and we'll email you when they respond.`
        : `You already have a pending request for ${organization.name}.`,
    };
  });
}

export async function cancelJoinRequestAction(requestId: string): Promise<void> {
  const user = await requireActionUser();
  await joinRequestService.cancel(user, requestId);
  refresh();
}
