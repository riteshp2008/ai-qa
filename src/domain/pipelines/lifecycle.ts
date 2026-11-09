import type { PipelineStatus } from "./types";

export const terminalStatuses: readonly PipelineStatus[] = ["completed", "failed", "rejected", "cancelled"];
const waitingStatuses: readonly PipelineStatus[] = ["awaiting_input", "awaiting_approval"];

export function isTerminal(status: PipelineStatus) {
  return terminalStatuses.includes(status);
}

/** True while agents are actively working (the UI polls in this state). */
export function isActive(status: PipelineStatus) {
  return !isTerminal(status) && !waitingStatuses.includes(status);
}

export function isAwaitingHuman(status: PipelineStatus) {
  return waitingStatuses.includes(status);
}

/** Ordered stages shown in the progress stepper. */
export const pipelineStages = [
  { key: "provisioning", label: "Sandbox" },
  { key: "analyzing", label: "Analyze" },
  { key: "containerizing", label: "Docker" },
  { key: "generating", label: "Write tests" },
  { key: "verifying", label: "Verify" },
  { key: "awaiting_approval", label: "Approval" },
  { key: "creating_pr", label: "Pull request" },
] as const satisfies ReadonlyArray<{ key: PipelineStatus; label: string }>;

export function stageIndex(status: PipelineStatus): number {
  if (status === "queued") return -1;
  if (status === "awaiting_input") return 2;
  if (status === "completed") return pipelineStages.length;
  return pipelineStages.findIndex((stage) => stage.key === status);
}

export const statusLabels: Record<PipelineStatus, string> = {
  queued: "Queued",
  provisioning: "Starting sandbox",
  analyzing: "Analyzing repository",
  containerizing: "Building container",
  awaiting_input: "Needs your input",
  generating: "Agents writing tests",
  verifying: "Verifying tests",
  awaiting_approval: "Awaiting approval",
  creating_pr: "Opening pull request",
  completed: "Completed",
  failed: "Failed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
