export type TestRunStatus =
  | "queued"
  | "running"
  | "retry_wait"
  | "passed"
  | "failed"
  | "needs_review"
  | "cancelled";

const transitions: Record<TestRunStatus, readonly TestRunStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["passed", "failed", "needs_review", "retry_wait", "cancelled"],
  retry_wait: ["running", "cancelled"],
  passed: [],
  failed: [],
  needs_review: ["passed", "failed"],
  cancelled: [],
};

export function canTransition(from: TestRunStatus, to: TestRunStatus) {
  return transitions[from].includes(to);
}

export function assertTransition(from: TestRunStatus, to: TestRunStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal test run transition: ${from} -> ${to}.`);
  }
}
