import "server-only";

import type { AppProfile, ContainerResult, SuiteKind, SuiteResult } from "@/domain/pipelines/types";
import { openPullRequestWithFiles } from "@/lib/github/pull-requests";
import { getRepositoryToken } from "@/lib/github/auth";
import { runContainerizer } from "@/server/agents/agents/containerizer";
import { writePullRequest } from "@/server/agents/agents/pr-writer";
import { analyzeRepository } from "@/server/agents/agents/repo-analyst";
import { agentForSuite, type TestWriterOutcome } from "@/server/agents/agents/test-writer";
import { collectRepoSnapshot } from "@/server/agents/context/collect";
import { deriveFacts, renderRepoContext } from "@/server/agents/context/repo-snapshot";
import { createDbEventSink } from "@/server/agents/runtime/db-event-sink";
import { GuardrailCounter } from "@/server/agents/runtime/events";
import { AsyncLock } from "@/server/agents/runtime/lock";
import { getSandboxProvider, type SandboxSession } from "@/server/agents/sandbox";
import { cloneRepository, collectChanges, restoreFiles, verifySuite, writeAppEnv } from "@/server/agents/sandbox/workspace";
import { artifactRepository, pipelineRepository } from "@/server/repositories/pipeline.repository";
import { runGeneration, toSuiteResult } from "./generation-graph";

/**
 * Each stage is one durable workflow step: it reconnects to the sandbox by id,
 * does one job, persists its output, and returns a small serializable result.
 */

type Env = Record<string, string>;
const secretsOf = (env: Env) => Object.values(env);

async function requireRecord(pipelineId: string) {
  const record = await pipelineRepository.findForWorker(pipelineId);
  if (!record) throw new Error(`Pipeline ${pipelineId} not found.`);
  return record;
}

async function connect(sandboxId: string): Promise<SandboxSession> {
  return getSandboxProvider().connect(sandboxId);
}

async function repoContextFor(session: SandboxSession) {
  const snapshot = await collectRepoSnapshot(session);
  const facts = deriveFacts(snapshot);
  return { snapshot, facts, rendered: renderRepoContext(snapshot, facts) };
}

/** Fresh sandbox + clone. On revision rounds, re-applies the previous round's files. */
export async function provisionStage(pipelineId: string, round: number): Promise<{ sandboxId: string; baseBranch: string }> {
  const record = await requireRecord(pipelineId);
  const sink = createDbEventSink(pipelineId);
  await pipelineRepository.setStage(pipelineId, "provisioning", round === 0 ? { startedAt: new Date() } : {});
  await sink.emit("orchestrator", "stage", round === 0 ? "Starting an isolated sandbox." : "Starting a fresh sandbox for the revision round.");

  const session = await getSandboxProvider().create({ metadata: { pipelineId, projectId: record.projectId } });
  await pipelineRepository.update(pipelineId, { sandboxId: session.id });
  const baseBranch = record.baseBranch ?? record.defaultBranch;
  const readToken = await getRepositoryToken(record.repositoryFullName, "read");
  await cloneRepository(session, record.repositoryFullName, readToken, baseBranch);

  if (round > 0) await restoreFiles(session, await artifactRepository.list(pipelineId));
  await pipelineRepository.update(pipelineId, { baseBranch });
  await sink.emit("orchestrator", "result", `Cloned ${record.repositoryFullName}@${baseBranch} into sandbox ${session.id.slice(0, 8)}.`);
  return { sandboxId: session.id, baseBranch };
}

export async function analyzeStage(pipelineId: string, sandboxId: string): Promise<AppProfile> {
  const sink = createDbEventSink(pipelineId);
  await pipelineRepository.setStage(pipelineId, "analyzing");
  await sink.emit("orchestrator", "stage", "Repo analyst is mapping the codebase.");
  const session = await connect(sandboxId);
  const { snapshot, facts, rendered } = await repoContextFor(session);
  const profile = await analyzeRepository({ facts, snapshot, context: rendered, sink });
  await pipelineRepository.update(pipelineId, { appProfile: profile });
  return profile;
}

export async function containerizeStage(pipelineId: string, sandboxId: string, profile: AppProfile, env: Env): Promise<ContainerResult> {
  const sink = createDbEventSink(pipelineId, secretsOf(env));
  await pipelineRepository.setStage(pipelineId, "containerizing");
  await sink.emit("orchestrator", "stage", profile.hasDockerfile ? "Containerizer is building the existing Dockerfile." : "No Dockerfile found — containerizer is writing one.");
  const session = await connect(sandboxId);
  const hasEnv = Object.keys(env).length > 0;
  if (hasEnv) await writeAppEnv(session, env);

  const result = await runContainerizer(
    { session, sink, installLock: new AsyncLock(), guardrails: new GuardrailCounter(), secrets: secretsOf(env), writtenFiles: new Set() },
    profile,
    hasEnv,
  );
  await pipelineRepository.mergeResults(pipelineId, { container: result });
  await sink.emit("containerizer", "result", result.status === "running" ? `App is running at ${result.appUrl}.` : `Container failed: ${result.summary}`);
  return result;
}

export type GenerationSummary = { outcomes: Partial<Record<SuiteKind, TestWriterOutcome>>; reviewVerdict: "approve" | "revise" | null; blockedActions: number };

export async function generateStage(input: {
  pipelineId: string;
  sandboxId: string;
  profile: AppProfile;
  container: ContainerResult;
  env: Env;
  humanFeedback?: string;
}): Promise<GenerationSummary> {
  const record = await requireRecord(input.pipelineId);
  const sink = createDbEventSink(input.pipelineId, secretsOf(input.env));
  await pipelineRepository.setStage(input.pipelineId, "generating");
  const session = await connect(input.sandboxId);
  await session.extend(60 * 60_000);
  const { rendered } = await repoContextFor(session);
  const guardrails = new GuardrailCounter();

  const generation = await runGeneration({
    shared: { session, sink, installLock: new AsyncLock(), guardrails, secrets: secretsOf(input.env) },
    suites: record.suites,
    profile: input.profile,
    repoContext: rendered,
    appUrl: input.container.appUrl,
    instructions: record.instructions ?? undefined,
    humanFeedback: input.humanFeedback,
  });

  if (generation.review) {
    await pipelineRepository.mergeResults(input.pipelineId, {
      review: { verdict: generation.review.verdict, issues: generation.review.issues, summary: generation.review.summary },
    });
  }
  return { outcomes: generation.outcomes, reviewVerdict: generation.review?.verdict ?? null, blockedActions: guardrails.blocked };
}

/**
 * The platform re-runs every suite itself (agents' self-reported numbers are
 * not trusted), then collects the diff through the final path/secret guardrail.
 */
export async function verifyAndCollectStage(input: {
  pipelineId: string;
  sandboxId: string;
  generation: GenerationSummary;
  container: ContainerResult;
  env: Env;
}): Promise<{ suites: Partial<Record<SuiteKind, SuiteResult>>; files: number }> {
  const sink = createDbEventSink(input.pipelineId, secretsOf(input.env));
  await pipelineRepository.setStage(input.pipelineId, "verifying");
  await sink.emit("orchestrator", "stage", "Independently re-running every generated suite.");
  const session = await connect(input.sandboxId);
  const envs: Record<string, string> = input.container.appUrl ? { BASE_URL: input.container.appUrl } : {};

  const suites: Partial<Record<SuiteKind, SuiteResult>> = {};
  for (const [suite, outcome] of Object.entries(input.generation.outcomes) as Array<[SuiteKind, TestWriterOutcome]>) {
    const reported = toSuiteResult(outcome);
    if (!outcome.runCommand || outcome.status === "blocked") {
      suites[suite] = reported;
      continue;
    }
    const verified = await verifySuite(session, outcome.runCommand, envs);
    const status = verified.exitCode === 0 && verified.failed === 0 ? "passed" : verified.passed > 0 ? "partial" : "failed";
    suites[suite] = { ...reported, status, passed: verified.passed, failed: verified.failed };
    await sink.emit(agentForSuite[suite], "result", `Verified by platform: ${status} (${verified.passed} passed, ${verified.failed} failed).`);
  }

  const changes = await collectChanges(session);
  const agentByKind = { dockerfile: "containerizer", e2e: "e2e-tester", api: "api-tester", unit: "unit-tester", config: "orchestrator", dependency: "orchestrator" } as const;
  await artifactRepository.replaceAll(input.pipelineId, changes.files.map((file) => ({ ...file, agent: agentByKind[file.kind] })));
  if (changes.revertedPaths.length) {
    await sink.emit("orchestrator", "guardrail", `Excluded ${changes.revertedPaths.length} file(s) outside the allowed scope from the pull request.`, { paths: changes.revertedPaths.slice(0, 50) });
  }
  await pipelineRepository.mergeResults(input.pipelineId, {
    suites,
    guardrails: { revertedPaths: changes.revertedPaths, blockedActions: input.generation.blockedActions },
  });
  return { suites, files: changes.files.length };
}

export async function teardownStage(pipelineId: string, sandboxId: string | null): Promise<void> {
  if (!sandboxId) return;
  try {
    await getSandboxProvider().kill(sandboxId);
  } catch (error) {
    console.warn(`Sandbox ${sandboxId} could not be killed (it may have expired).`, error);
  }
  await pipelineRepository.update(pipelineId, { sandboxId: null });
}

export async function pullRequestStage(pipelineId: string): Promise<{ url: string; number: number }> {
  const record = await requireRecord(pipelineId);
  const sink = createDbEventSink(pipelineId);
  await pipelineRepository.setStage(pipelineId, "creating_pr");
  await sink.emit("pr-writer", "stage", "Writing the pull request.");

  const artifacts = await artifactRepository.list(pipelineId);
  if (artifacts.length === 0) throw new Error("There are no generated files to open a pull request with.");
  const { title, body } = await writePullRequest(record, artifacts.map((artifact) => artifact.path));
  const anyFailing = Object.values(record.results.suites ?? {}).some((suite) => suite && suite.status !== "passed" && suite.status !== "skipped");

  const pull = await openPullRequestWithFiles({
    repositoryFullName: record.repositoryFullName,
    baseBranch: record.baseBranch ?? record.defaultBranch,
    branch: `sentinel/tests-${pipelineId.slice(0, 8)}`,
    title,
    body,
    commitMessage: `${title}\n\nGenerated by Sentinel pipeline ${pipelineId}.`,
    files: artifacts.map((artifact) => ({ path: artifact.path, content: artifact.content })),
    draft: anyFailing,
  });
  await pipelineRepository.update(pipelineId, { prUrl: pull.url, prNumber: pull.number, prBranch: pull.branch });
  await sink.emit("pr-writer", "result", `Opened ${anyFailing ? "draft " : ""}pull request #${pull.number}.`, { url: pull.url });
  return { url: pull.url, number: pull.number };
}
