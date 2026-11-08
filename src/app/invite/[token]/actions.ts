"use server";

import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/forms/action-state";
import { runAction } from "@/server/actions/run-action";
import { requireActionUser } from "@/server/auth/session";
import { inviteService } from "@/server/services/invite.service";

export async function acceptInviteAction(token: string): Promise<ActionState> {
  return runAction({}, async () => {
    const user = await requireActionUser();
    const organization = await inviteService.accept(user, token);
    redirect(`/o/${organization.slug}?welcome=1`);
  });
}
