"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/forms/action-state";
import { formValues, runAction } from "@/server/actions/run-action";
import { requireOrganizationAccess } from "@/server/auth/organization-context";
import { membershipService } from "@/server/services/membership.service";
import { organizationService } from "@/server/services/organization.service";

export async function renameOrganizationAction(orgSlug: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const context = await requireOrganizationAccess(orgSlug, "organization:update");
    await organizationService.rename(context, values);
    refresh();
    return { status: "success", message: "Organization name updated." };
  });
}

export async function leaveOrganizationAction(orgSlug: string): Promise<ActionState> {
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug);
    await membershipService.leave(context);
    redirect("/dashboard");
  });
}
