import type { TestRunStatus } from "./lifecycle";

export type TestRunSummary = {
  id: string;
  projectId: string;
  projectName: string;
  status: TestRunStatus;
  instruction: string;
  targetUrl: string;
  createdAt: Date;
  completedAt: Date | null;
};

export const ACTIVE_RUN_STATUSES: readonly TestRunStatus[] = ["queued", "running", "retry_wait"];

export function isActiveRun(status: TestRunStatus) {
  return ACTIVE_RUN_STATUSES.includes(status);
}
