export const TEST_RUN_ACCEPTED_EVENT = "sentinel/test-run.accepted" as const;

export type TestRunAcceptedEvent = {
  name: typeof TEST_RUN_ACCEPTED_EVENT;
  data: {
    runId: string;
    attemptId: string;
    ownerId: string;
    projectId: string;
    idempotencyKey: string;
  };
};
