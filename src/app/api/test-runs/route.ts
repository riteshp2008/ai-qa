import { NextResponse } from "next/server";

import { getMissingRunIntakeVariables, hasRunIntakeConfigured } from "@/lib/config";
import {
  hashTestRunRequest,
  validateTestRunRequest,
} from "@/domain/test-runs/request";
import { isTargetWithinProjectScope } from "@/domain/projects/target-scope";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { TEST_RUN_ACCEPTED_EVENT } from "@/domain/test-runs/events";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const validation = validateTestRunRequest(body);
  if (!validation.value) {
    return NextResponse.json({ message: "Invalid test-run request.", errors: validation.errors }, { status: 400 });
  }

  if (!validation.value.projectId) {
    return NextResponse.json({ message: "A project is required to start a test run." }, { status: 400 });
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, target_url")
    .eq("id", validation.value.projectId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (projectError) {
    console.error("Test-run authorization failed.", projectError);
    return NextResponse.json({ message: "Unable to authorize the test run." }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  if (!isTargetWithinProjectScope(project.target_url, validation.value.url)) {
    return NextResponse.json({ message: "Target URL is outside the project's authorized scope." }, { status: 403 });
  }

  if (!hasRunIntakeConfigured()) {
    return NextResponse.json({
      message: "Durable run intake is not configured yet.",
      missing: getMissingRunIntakeVariables(),
    }, { status: 503 });
  }

  const requestHash = hashTestRunRequest(validation.value);
  const { data: intake, error: intakeError } = await supabase.rpc("create_test_run", {
    p_project_id: project.id,
    p_url: validation.value.url,
    p_instruction: validation.value.instruction,
    p_idempotency_key: validation.value.idempotencyKey,
    p_request_hash: requestHash,
    p_event_payload: {
      runId: "pending",
      ownerId: user.id,
      projectId: project.id,
      idempotencyKey: validation.value.idempotencyKey,
    },
  });

  if (intakeError || !intake) {
    console.error("Durable run creation failed.", intakeError);
    if (intakeError?.message.includes("Idempotency key was already used")) {
      return NextResponse.json({ message: intakeError.message }, { status: 409 });
    }
    return NextResponse.json({ message: "Unable to persist the test run." }, { status: 500 });
  }

  const run = intake.run as { id: string; current_attempt: number };
  const attempt = intake.attempt as { id?: string };
  if (!attempt?.id) {
    return NextResponse.json({ message: "Persisted run is missing its execution attempt." }, { status: 500 });
  }

  const event = {
    name: TEST_RUN_ACCEPTED_EVENT,
    data: {
      runId: run.id,
      attemptId: attempt.id,
      ownerId: user.id,
      projectId: project.id,
      idempotencyKey: validation.value.idempotencyKey,
    },
  } as const;

  try {
    await inngest.send(event);
    const serviceRole = createSupabaseServiceRoleClient();
    const { error: outboxError } = await serviceRole
      .from("outbox_events")
      .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
      .eq("id", intake.outbox_id)
      .eq("status", "pending");

    if (outboxError) {
      throw new Error(`Unable to mark dispatch intent sent: ${outboxError.message}`);
    }
  } catch (error) {
    console.error("Test-run dispatch failed.", error);
    return NextResponse.json({ message: "Run was persisted but dispatch is currently unavailable.", runId: run.id }, { status: 503 });
  }

  return NextResponse.json({
    runId: run.id,
    status: "queued",
    statusUrl: `/api/test-runs/${run.id}`,
    created: intake.created,
  }, { status: intake.created ? 202 : 200 });
}
