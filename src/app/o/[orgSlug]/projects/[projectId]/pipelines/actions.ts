"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/forms/action-state";
import { formValues, runAction } from "@/server/actions/run-action";
import { requireOrganizationAccess } from "@/server/auth/organization-context";
import { pipelineService } from "@/server/services/pipeline.service";

export async function startPipelineAction(orgSlug: string, projectId: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const context = await requireOrganizationAccess(orgSlug, "pipelines:run");
    const pipeline = await pipelineService.start(context, projectId, {
      repositoryId: values.repositoryId,
      // Checkboxes share a name; formValues keeps only the last, so read them all.
      suites: formData.getAll("suites").map(String),
      instructions: values.instructions,
    });
    redirect(`/o/${orgSlug}/projects/${projectId}/pipelines/${pipeline.id}`);
  });
}

export async function reviewPipelineAction(orgSlug: string, pipelineId: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const context = await requireOrganizationAccess(orgSlug, "pipelines:approve");
    await pipelineService.review(context, pipelineId, values);
    refresh();
    return {
      status: "success",
      message: values.decision === "approve" ? "Approved — opening the pull request." : values.decision === "reject" ? "Rejected." : "Sent back to the agents with your feedback.",
    };
  });
}

export async function provideEnvironmentAction(orgSlug: string, pipelineId: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  // Never echo env values back into form state.
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug, "pipelines:run");
    await pipelineService.provideEnvironment(context, pipelineId, { env: String(formData.get("env") ?? "") });
    refresh();
    return { status: "success", message: "Configuration sent. The containerizer will retry." };
  });
}

export async function cancelPipelineAction(orgSlug: string, pipelineId: string): Promise<ActionState> {
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug, "pipelines:cancel");
    await pipelineService.cancel(context, pipelineId);
    refresh();
  });
}
