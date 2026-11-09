import "server-only";

import { NonRetriableError } from "inngest";

import {
  PIPELINE_CANCELLED_EVENT,
  PIPELINE_INPUT_EVENT,
  PIPELINE_REQUESTED_EVENT,
  PIPELINE_REVIEWED_EVENT,
  type PipelineInputData,
  type PipelineRequestedData,
  type PipelineReviewedData,
} from "@/domain/pipelines/events";
import { inngest } from "@/lib/inngest/client";
import {
  analyzeStage,
  containerizeStage,
  generateStage,
  provisionStage,
  pullRequestStage,
  teardownStage,
  verifyAndCollectStage,
} from "@/server/agents/orchestrator/stages";
import { createDbEventSink } from "@/server/agents/runtime/db-event-sink";
import { pipelineRepository } from "@/server/repositories/pipeline.repository";

/** How many times a human can send the agents back with feedback. */
const MAX_HUMAN_ROUNDS = 3;
/** How many times we ask a human for configuration before giving up. */
const MAX_INPUT_REQUESTS = 2;

/**
 * Durable orchestration of the multi-agent test pipeline.
 *
 *   provision → analyze → containerize ⟲(HITL: missing env) → generate (agents + reviewer loop)
 *     → verify & collect → teardown → HITL approval ─┬─ approve → open PR → done
 *                                                    ├─ request changes → loop (fresh sandbox)
 *                                                    └─ reject → done
 *
 * Every stage is a retryable step; waits survive deploys. Human-provided env
 * lives only in event payloads/step memory, never in our database.
 */
export const runTestPipeline = inngest.createFunction(
  {
    id: "run-test-pipeline",
    name: "Agentic test pipeline",
    retries: 1,
    triggers: [{ event: PIPELINE_REQUESTED_EVENT }],
    concurrency: [
      { key: "event.data.projectId", limit: 1 },
      { limit: Number(process.env.PIPELINE_CONCURRENCY ?? 5) },
    ],
    cancelOn: [{ event: PIPELINE_CANCELLED_EVENT, match: "data.pipelineId" }],
    onFailure: async ({ event, error }) => {
      const { pipelineId } = (event.data.event.data ?? {}) as PipelineRequestedData;
      if (!pipelineId) return;
      const record = await pipelineRepository.findForWorker(pipelineId);
      await teardownStage(pipelineId, record?.sandboxId ?? null);
      if (await pipelineRepository.setStage(pipelineId, "failed")) {
        await pipelineRepository.update(pipelineId, { error: error.message.slice(0, 1000) });
      }
      await createDbEventSink(pipelineId).emit("orchestrator", "error", `Pipeline failed: ${error.message.slice(0, 500)}`);
    },
  },
  async ({ event, step }) => {
    const { pipelineId } = event.data as PipelineRequestedData;
    let env: Record<string, string> = {};
    let humanFeedback: string | undefined;

    for (let round = 0; round < MAX_HUMAN_ROUNDS; round += 1) {
      await step.run(`round-${round}-start`, () => pipelineRepository.update(pipelineId, { reviewRound: round }));

      // Containerize, pausing for human configuration when the app can't boot without it.
      let sandboxId = "";
      let container;
      let profile;
      for (let attempt = 0; ; attempt += 1) {
        ({ sandboxId } = await step.run(`provision-${round}-${attempt}`, () => provisionStage(pipelineId, round)));
        profile = await step.run(`analyze-${round}-${attempt}`, () => analyzeStage(pipelineId, sandboxId));
        container = await step.run(`containerize-${round}-${attempt}`, () => containerizeStage(pipelineId, sandboxId, profile!, env));
        if (container.status === "running" || container.missingEnv.length === 0 || attempt >= MAX_INPUT_REQUESTS) break;

        await step.run(`await-input-${round}-${attempt}`, async () => {
          await teardownStage(pipelineId, sandboxId);
          await pipelineRepository.setStage(pipelineId, "awaiting_input");
          await createDbEventSink(pipelineId).emit("orchestrator", "hitl", `The app needs configuration to start: ${container!.missingEnv.join(", ")}. Waiting for a human.`, { missingEnv: container!.missingEnv });
        });
        const input = await step.waitForEvent(`input-${round}-${attempt}`, { event: PIPELINE_INPUT_EVENT, match: "data.pipelineId", timeout: "3d" });
        if (!input) throw new NonRetriableError("Timed out waiting for the configuration the app needs to start.");
        env = { ...env, ...(input.data as PipelineInputData).env };
      }

      const generation = await step.run(`generate-${round}`, () =>
        generateStage({ pipelineId, sandboxId, profile: profile!, container: container!, env, humanFeedback }),
      );
      const verified = await step.run(`verify-${round}`, () =>
        verifyAndCollectStage({ pipelineId, sandboxId, generation, container: container!, env }),
      );
      await step.run(`teardown-${round}`, () => teardownStage(pipelineId, sandboxId));

      if (verified.files === 0) throw new NonRetriableError("The agents did not produce any files that could be proposed.");

      await step.run(`await-approval-${round}`, async () => {
        await pipelineRepository.setStage(pipelineId, "awaiting_approval");
        await createDbEventSink(pipelineId).emit("orchestrator", "hitl", "Tests are ready for human review. Approve to open a pull request, request changes, or reject.");
      });
      const review = await step.waitForEvent(`approval-${round}`, { event: PIPELINE_REVIEWED_EVENT, match: "data.pipelineId", timeout: "7d" });
      if (!review) throw new NonRetriableError("Timed out waiting for human approval.");
      const { decision, feedback } = review.data as PipelineReviewedData;

      if (decision === "reject") {
        await step.run("rejected", () => pipelineRepository.setStage(pipelineId, "rejected"));
        return { status: "rejected" };
      }
      if (decision === "approve") {
        const pull = await step.run("open-pull-request", () => pullRequestStage(pipelineId));
        await step.run("completed", () => pipelineRepository.setStage(pipelineId, "completed"));
        return { status: "completed", pullRequest: pull.url };
      }
      humanFeedback = feedback;
    }

    throw new NonRetriableError(`Stopped after ${MAX_HUMAN_ROUNDS} review rounds without approval.`);
  },
);

/** Cancellation stops the workflow; this makes sure its sandbox doesn't linger. */
export const cleanupCancelledPipeline = inngest.createFunction(
  { id: "cleanup-cancelled-pipeline", retries: 3, triggers: [{ event: PIPELINE_CANCELLED_EVENT }] },
  async ({ event, step }) => {
    const { pipelineId } = event.data as { pipelineId: string };
    await step.run("kill-sandbox", async () => {
      const record = await pipelineRepository.findForWorker(pipelineId);
      await teardownStage(pipelineId, record?.sandboxId ?? null);
    });
  },
);
