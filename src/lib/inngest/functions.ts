import { inngest } from "@/lib/inngest/client";
import { TEST_RUN_ACCEPTED_EVENT, type TestRunAcceptedEvent } from "@/domain/test-runs/events";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const processAcceptedTestRun = inngest.createFunction(
  {
    id: "process-accepted-test-run",
    retries: 0,
    triggers: [{ event: TEST_RUN_ACCEPTED_EVENT }],
  },
  async ({ event, step }) => {
    const acceptedData = event.data as TestRunAcceptedEvent["data"];

    await step.run("record-execution-review", async () => {
      const supabase = createSupabaseServiceRoleClient();
      const { error } = await supabase.rpc("mark_test_run_needs_review", {
        p_run_id: acceptedData.runId,
        p_attempt_id: acceptedData.attemptId,
        p_reason: "Browser execution is not implemented yet; no provider result or evidence was produced.",
      });

      if (error) {
        throw new Error(`Unable to record execution review state: ${error.message}`);
      }
    });

    return {
      runId: acceptedData.runId,
      status: "needs_review" as const,
      reason: "execution_not_available",
    };
  },
);
