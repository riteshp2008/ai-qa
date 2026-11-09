import "server-only";

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import type { AppProfile, SuiteKind, SuiteResult } from "@/domain/pipelines/types";
import { reviewArtifacts, type ReviewOutcome } from "@/server/agents/agents/reviewer";
import { runTestWriter, type TestWriterOutcome } from "@/server/agents/agents/test-writer";
import { inspectTestFile, type QualityIssue } from "@/server/agents/guardrails/test-quality";
import type { ToolContext } from "@/server/agents/runtime/tools";

export const MAX_REVIEW_ROUNDS = 2;

type SharedContext = Omit<ToolContext, "agent" | "writtenFiles">;

const GenerationState = Annotation.Root({
  pending: Annotation<SuiteKind[]>({ reducer: (_current, update) => update, default: () => [] }),
  round: Annotation<number>({ reducer: (_current, update) => update, default: () => 0 }),
  outcomes: Annotation<Partial<Record<SuiteKind, TestWriterOutcome>>>({ reducer: (current, update) => ({ ...current, ...update }), default: () => ({}) }),
  feedback: Annotation<Partial<Record<SuiteKind, string>>>({ reducer: (_current, update) => update, default: () => ({}) }),
  qualityIssues: Annotation<QualityIssue[]>({ reducer: (_current, update) => update, default: () => [] }),
  review: Annotation<ReviewOutcome | null>({ reducer: (_current, update) => update, default: () => null }),
});

export type GenerationResult = {
  outcomes: Partial<Record<SuiteKind, TestWriterOutcome>>;
  review: ReviewOutcome | null;
  rounds: number;
};

/**
 * Supervisor for the test-writing stage:
 *
 *   START → write_tests (agents in parallel) → quality_gate → review ─┬─ approve / budget spent → END
 *                ↑                                                  └─ revise → (only suites with feedback)
 *
 * The reviewer sends targeted feedback to specific agents; at most MAX_REVIEW_ROUNDS revisions.
 */
export async function runGeneration(input: {
  shared: SharedContext;
  suites: SuiteKind[];
  profile: AppProfile;
  repoContext: string;
  appUrl: string | null;
  instructions?: string;
  /** Feedback from a human reviewer that applies to this whole run. */
  humanFeedback?: string;
}): Promise<GenerationResult> {
  const { shared } = input;

  const writeTests = async (state: typeof GenerationState.State) => {
    await shared.sink.emit("orchestrator", "stage", state.round === 0
      ? `Dispatching ${state.pending.join(", ")} agents in parallel.`
      : `Revision round ${state.round}: re-running ${state.pending.join(", ")}.`);

    const entries = await Promise.all(
      state.pending.map(async (suite) => {
        const blocked = suite !== "unit" && !input.appUrl;
        if (blocked) {
          const outcome: TestWriterOutcome = { status: "blocked", passed: 0, failed: 0, files: [], iterations: 0, summary: "Skipped: the application could not be started in a container.", suspectedBugs: [], runCommand: null };
          return [suite, outcome] as const;
        }
        const feedback = [state.feedback[suite], input.humanFeedback].filter(Boolean).join("\n\n") || undefined;
        const outcome = await runTestWriter(
          { ...shared, writtenFiles: new Set(state.outcomes[suite]?.files ?? []) },
          { suite, profile: input.profile, repoContext: input.repoContext, appUrl: input.appUrl, instructions: input.instructions, feedback },
        );
        await shared.sink.emit(agentLabel(suite), "result", `${outcome.status.toUpperCase()}: ${outcome.passed} passed, ${outcome.failed} failed. ${outcome.summary}`.slice(0, 600));
        return [suite, outcome] as const;
      }),
    );
    return { outcomes: Object.fromEntries(entries) as Partial<Record<SuiteKind, TestWriterOutcome>> };
  };

  const qualityGate = async (state: typeof GenerationState.State) => {
    const issues: QualityIssue[] = [];
    for (const outcome of Object.values(state.outcomes)) {
      for (const path of outcome?.files ?? []) {
        if (!(await shared.session.exists(path))) continue;
        issues.push(...inspectTestFile(path, await shared.session.readFile(path)));
      }
    }
    if (issues.length) await shared.sink.emit("orchestrator", "guardrail", `Static test-quality checks found ${issues.length} problem(s).`, { issues });
    return { qualityIssues: issues };
  };

  const review = async (state: typeof GenerationState.State) => {
    const files = await Promise.all(
      (Object.entries(state.outcomes) as Array<[SuiteKind, TestWriterOutcome]>).flatMap(([suite, outcome]) =>
        outcome.files.map(async (path) => ({
          path,
          suite,
          content: (await shared.session.exists(path)) ? await shared.session.readFile(path) : "",
        })),
      ),
    );
    const results = Object.fromEntries(Object.entries(state.outcomes).map(([suite, outcome]) => [suite, toSuiteResult(outcome!)])) as Partial<Record<SuiteKind, SuiteResult>>;
    const outcome = await reviewArtifacts({ files, results, qualityIssues: state.qualityIssues, sink: shared.sink });
    return { review: outcome, feedback: outcome.feedback };
  };

  const prepareRevision = async (state: typeof GenerationState.State) => ({
    round: state.round + 1,
    pending: (Object.keys(state.feedback) as SuiteKind[]).filter((suite) => input.suites.includes(suite) && state.outcomes[suite]?.status !== "blocked"),
  });

  const graph = new StateGraph(GenerationState)
    .addNode("write_tests", writeTests)
    .addNode("quality_gate", qualityGate)
    .addNode("review", review)
    .addNode("prepare_revision", prepareRevision)
    .addEdge(START, "write_tests")
    .addEdge("write_tests", "quality_gate")
    .addEdge("quality_gate", "review")
    .addConditionalEdges("review", (state) => {
      const needsRevision = state.review?.verdict === "revise" && Object.keys(state.feedback).length > 0;
      return needsRevision && state.round < MAX_REVIEW_ROUNDS ? "prepare_revision" : END;
    })
    .addConditionalEdges("prepare_revision", (state) => (state.pending.length ? "write_tests" : END))
    .compile();

  const final = await graph.invoke({ pending: input.suites }, { recursionLimit: 40 });
  return { outcomes: final.outcomes, review: final.review, rounds: final.round + 1 };
}

function agentLabel(suite: SuiteKind) {
  return suite === "e2e" ? "e2e-tester" : suite === "api" ? "api-tester" : "unit-tester";
}

export function toSuiteResult(outcome: TestWriterOutcome): SuiteResult {
  return {
    status: outcome.status,
    passed: outcome.passed,
    failed: outcome.failed,
    files: outcome.files,
    iterations: outcome.iterations,
    summary: outcome.summary,
    suspectedBugs: outcome.suspectedBugs,
  };
}
