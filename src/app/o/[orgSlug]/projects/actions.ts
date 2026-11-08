"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/forms/action-state";
import { formValues, runAction } from "@/server/actions/run-action";
import { requireOrganizationAccess } from "@/server/auth/organization-context";
import { projectService } from "@/server/services/project.service";
import { repositoryLinkService } from "@/server/services/repository-link.service";
import { testRunService } from "@/server/services/test-run.service";

export async function createProjectAction(orgSlug: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const context = await requireOrganizationAccess(orgSlug, "projects:create");
    const project = await projectService.create(context, values);
    redirect(`/o/${orgSlug}/projects/${project.id}?created=1`);
  });
}

export async function deleteProjectAction(orgSlug: string, projectId: string): Promise<ActionState> {
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug, "projects:delete");
    await projectService.delete(context, projectId);
    redirect(`/o/${orgSlug}/projects`);
  });
}

export async function linkRepositoryAction(orgSlug: string, projectId: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const context = await requireOrganizationAccess(orgSlug, "repositories:link");
    const repository = await repositoryLinkService.link(context, projectId, values);
    refresh();
    return { status: "success", message: `Linked ${repository.fullName}.` };
  });
}

export async function unlinkRepositoryAction(orgSlug: string, linkId: string): Promise<ActionState> {
  return runAction({}, async () => {
    const context = await requireOrganizationAccess(orgSlug, "repositories:unlink");
    await repositoryLinkService.unlink(context, linkId);
    refresh();
  });
}

export async function startTestRunAction(orgSlug: string, projectId: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  return runAction(values, async () => {
    const context = await requireOrganizationAccess(orgSlug, "runs:create");
    const project = await projectService.get(context, projectId);
    const { runId } = await testRunService.start(context.user, {
      projectId: project.id,
      url: values.url || project.targetUrl,
      instruction: values.instruction,
      idempotencyKey: values.idempotencyKey,
    });
    refresh();
    return { status: "success", message: `Run ${runId.slice(0, 8)} queued.` };
  });
}
