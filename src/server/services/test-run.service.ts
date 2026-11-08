import "server-only";

import { AppError } from "@/domain/errors";
import { isUuid } from "@/domain/ids";
import { isTargetWithinProjectScope } from "@/domain/projects/target-scope";
import { TEST_RUN_ACCEPTED_EVENT } from "@/domain/test-runs/events";
import { hashTestRunRequest, validateTestRunRequest } from "@/domain/test-runs/request";
import type { TestRunSummary } from "@/domain/test-runs/types";
import { can } from "@/domain/organizations/roles";
import { getMissingRunIntakeVariables, hasRunIntakeConfigured } from "@/lib/config";
import { inngest } from "@/lib/inngest/client";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { OrganizationContext } from "@/server/auth/organization-context";
import type { SessionUser } from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { testRunRepository } from "@/server/repositories/test-run.repository";

export type StartedTestRun = { runId: string; created: boolean };

/** Persists the run through the durable intake RPC (run + attempt + outbox row in one transaction). */
async function persistRun(projectId: string, ownerId: string, request: { url: string; instruction: string; idempotencyKey: string; projectId?: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: intake, error } = await supabase.rpc("create_test_run", {
    p_project_id: projectId,
    p_url: request.url,
    p_instruction: request.instruction,
    p_idempotency_key: request.idempotencyKey,
    p_request_hash: hashTestRunRequest(request),
    p_event_payload: { runId: "pending", ownerId, projectId, idempotencyKey: request.idempotencyKey },
  });

  if (error || !intake) {
    if (error?.message.includes("Idempotency key was already used")) throw new AppError("conflict", error.message);
    console.error("Durable run creation failed.", error);
    throw new Error("Unable to persist the test run.");
  }

  const run = intake.run as { id: string };
  const attempt = intake.attempt as { id?: string } | null;
  if (!attempt?.id) throw new Error("Persisted run is missing its execution attempt.");
  return { runId: run.id, attemptId: attempt.id, outboxId: intake.outbox_id as string, outboxPending: intake.outbox_status === "pending", created: Boolean(intake.created) };
}

/** Sends the accepted event and marks the outbox row as sent. */
async function dispatchRun(payload: { runId: string; attemptId: string; ownerId: string; projectId: string; idempotencyKey: string }, outboxId: string) {
  await inngest.send({ name: TEST_RUN_ACCEPTED_EVENT, data: payload });
  const { error } = await createSupabaseServiceRoleClient()
    .from("outbox_events")
    .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
    .eq("id", outboxId)
    .eq("status", "pending");
  if (error) throw new Error(`Unable to mark dispatch intent sent: ${error.message}`);
}

export const testRunService = {
  async listForOrganization(context: OrganizationContext, options: { projectId?: string; limit?: number } = {}): Promise<TestRunSummary[]> {
    if (options.projectId && !isUuid(options.projectId)) return [];
    return testRunRepository.listForOrganization(context.organization.id, options);
  },

  statusCounts(context: OrganizationContext) {
    return testRunRepository.statusCounts(context.organization.id);
  },

  /**
   * Validates, authorizes, persists, and dispatches a test run. Used by both
   * the dashboard (server action) and the public API (route handler).
   */
  async start(user: SessionUser, input: unknown): Promise<StartedTestRun> {
    const validation = validateTestRunRequest(input);
    if (!validation.value) {
      const fieldErrors = Object.fromEntries(validation.errors.map((error) => [error.field, [error.message]]));
      throw new AppError("validation", "Invalid test-run request.", fieldErrors);
    }
    const request = validation.value;
    if (!request.projectId) throw new AppError("validation", "A project is required to start a test run.", { projectId: ["Choose a project."] });

    const project = await projectRepository.findById(request.projectId);
    const role = project ? await organizationRepository.findMembership(user.id, project.organizationId) : null;
    if (!project || !role) throw new AppError("not_found", "Project not found.");
    if (!can(role, "runs:create")) throw new AppError("forbidden", "You can't start runs in this organization.");
    if (!isTargetWithinProjectScope(project.targetUrl, request.url)) {
      throw new AppError("forbidden", "Target URL is outside the project's authorized scope.", { url: [`Must be on ${new URL(project.targetUrl).origin}.`] });
    }
    if (!hasRunIntakeConfigured()) {
      throw new AppError("unavailable", `Run intake isn't configured yet. Missing: ${getMissingRunIntakeVariables().join(", ")}.`);
    }

    const persisted = await persistRun(project.id, user.id, request);
    if (persisted.outboxPending) {
      try {
        await dispatchRun({ runId: persisted.runId, attemptId: persisted.attemptId, ownerId: user.id, projectId: project.id, idempotencyKey: request.idempotencyKey }, persisted.outboxId);
      } catch (error) {
        console.error("Test-run dispatch failed.", error);
        throw new AppError("unavailable", "The run was saved but couldn't be dispatched yet. It will be retried.");
      }
    }
    return { runId: persisted.runId, created: persisted.created };
  },
};
