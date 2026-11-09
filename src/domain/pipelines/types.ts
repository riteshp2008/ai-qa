export const suiteKinds = ["e2e", "api", "unit"] as const;
export type SuiteKind = (typeof suiteKinds)[number];

export type PipelineStatus =
  | "queued"
  | "provisioning"
  | "analyzing"
  | "containerizing"
  | "awaiting_input"
  | "generating"
  | "verifying"
  | "awaiting_approval"
  | "creating_pr"
  | "completed"
  | "failed"
  | "rejected"
  | "cancelled";

export type AgentName =
  | "orchestrator"
  | "repo-analyst"
  | "containerizer"
  | "e2e-tester"
  | "api-tester"
  | "unit-tester"
  | "reviewer"
  | "pr-writer"
  | "human";

export type PipelineEventKind = "stage" | "thought" | "tool" | "result" | "guardrail" | "review" | "hitl" | "error";
export type ArtifactKind = "dockerfile" | "e2e" | "api" | "unit" | "config" | "dependency";
export type ReviewDecision = "approve" | "request_changes" | "reject";

/** What the repo analyst learned about how to build, run, and test the application. */
export type AppProfile = {
  stack: string;
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | "pip" | "poetry" | "go" | "other";
  installCommand: string;
  buildCommand: string | null;
  startCommand: string;
  port: number;
  healthPath: string;
  hasDockerfile: boolean;
  hasHttpApi: boolean;
  apiBasePath: string | null;
  unitFramework: "vitest" | "jest" | "pytest" | "go" | "mocha" | "none";
  requiredEnv: string[];
  notes: string;
};

export type SuiteStatus = "passed" | "failed" | "partial" | "skipped" | "blocked";

export type SuiteResult = {
  status: SuiteStatus;
  passed: number;
  failed: number;
  files: string[];
  iterations: number;
  summary: string;
  /** Failures the agent believes are genuine application bugs, not test bugs. */
  suspectedBugs: string[];
};

export type ContainerResult = {
  status: "running" | "failed";
  createdDockerfile: boolean;
  appUrl: string | null;
  attempts: number;
  summary: string;
  missingEnv: string[];
};

export type ReviewIssue = { path: string; severity: "blocker" | "major" | "minor"; message: string };

export type PipelineResults = {
  container?: ContainerResult;
  suites?: Partial<Record<SuiteKind, SuiteResult>>;
  review?: { verdict: "approve" | "revise"; issues: ReviewIssue[]; summary: string };
  guardrails?: { revertedPaths: string[]; blockedActions: number };
};

export type Pipeline = {
  id: string;
  organizationId: string;
  projectId: string;
  repositoryId: string;
  repositoryFullName: string;
  status: PipelineStatus;
  suites: SuiteKind[];
  instructions: string | null;
  appProfile: AppProfile | null;
  results: PipelineResults;
  reviewRound: number;
  prUrl: string | null;
  prNumber: number | null;
  prBranch: string | null;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type PipelineEvent = {
  id: number;
  agent: string;
  kind: PipelineEventKind;
  message: string;
  data: Record<string, unknown> | null;
  createdAt: Date;
};

export type Artifact = {
  id: string;
  path: string;
  kind: ArtifactKind;
  agent: string;
  content: string;
  updatedAt: Date;
};
