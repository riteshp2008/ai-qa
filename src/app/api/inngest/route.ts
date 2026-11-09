import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { processAcceptedTestRun } from "@/lib/inngest/functions";
import { cleanupCancelledPipeline, runTestPipeline } from "@/server/workflows/test-pipeline.workflow";

/**
 * Agent stages can run for many minutes. On serverless hosts raise this to
 * the platform maximum, or serve Inngest from a long-running worker.
 */
export const maxDuration = 800;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processAcceptedTestRun, runTestPipeline, cleanupCancelledPipeline],
});
