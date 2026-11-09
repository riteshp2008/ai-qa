import "server-only";

import { z } from "zod";

import type { AgentName, AppProfile, SuiteKind, SuiteResult } from "@/domain/pipelines/types";
import { checkCommand } from "@/server/agents/guardrails/commands";
import { runAgentLoop } from "@/server/agents/runtime/agent-loop";
import { createSandboxTools, type ToolContext } from "@/server/agents/runtime/tools";
import { sharedRules, suiteGuidance } from "./prompts";

export const agentForSuite: Record<SuiteKind, AgentName> = { e2e: "e2e-tester", api: "api-tester", unit: "unit-tester" };

const reportSchema = z.object({
  status: z.enum(["passed", "failed", "partial"]),
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  files: z.array(z.string()).describe("Test files you created or changed"),
  runCommand: z.string().describe("Exact command that runs exactly your tests from the repo root; used for independent verification"),
  summary: z.string().describe("What you covered and how"),
  suspectedBugs: z.array(z.string()).describe("Failures you believe are genuine application bugs (with evidence), not test bugs"),
});

export type TestWriterOutcome = SuiteResult & { runCommand: string | null };

export type TestWriterInput = {
  suite: SuiteKind;
  profile: AppProfile;
  repoContext: string;
  appUrl: string | null;
  instructions?: string;
  /** Reviewer or human feedback from a previous round. */
  feedback?: string;
};

/**
 * A specialist test-writing agent (E2E, API, or unit). Loops: explore →
 * write tests → run → fix test bugs → repeat, then reports results.
 */
export async function runTestWriter(context: Omit<ToolContext, "agent">, input: TestWriterInput): Promise<TestWriterOutcome> {
  const agent = agentForSuite[input.suite];
  const envs = input.appUrl ? { ...context.envs, BASE_URL: input.appUrl } : context.envs;
  const tools = createSandboxTools({ ...context, agent, envs });

  const { report, iterations, stopReason } = await runAgentLoop({
    agent,
    sink: context.sink,
    tools,
    reportSchema,
    maxIterations: input.feedback ? 18 : 28,
    maxDurationMs: 25 * 60_000,
    systemPrompt: `${sharedRules(agent)}

${suiteGuidance[input.suite]}`,
    task: [
      input.repoContext,
      `Application profile:\n${JSON.stringify(input.profile, null, 2)}`,
      input.appUrl ? `The application is running at BASE_URL=${input.appUrl} (exported to your commands).` : "The application is NOT running; only write tests that do not need it.",
      input.instructions ? `User instructions (from the project owner, trusted):\n${input.instructions}` : "",
      input.feedback ? `REVISION REQUESTED. Address this feedback, keeping what already works:\n${input.feedback}` : "",
      "Explore the code, write the tests, run them, iterate until they pass for correct behaviour, then submit_report.",
    ].filter(Boolean).join("\n\n"),
  });

  if (!report) {
    return { status: "failed", passed: 0, failed: 0, files: [...context.writtenFiles], iterations, summary: `Agent stopped without reporting (${stopReason}).`, suspectedBugs: [], runCommand: null };
  }
  // The run command is re-executed later by the platform; it must pass the same command policy.
  const runCommand = checkCommand(agent, report.runCommand).ok ? report.runCommand : null;
  return { ...report, files: [...new Set([...report.files, ...context.writtenFiles])], iterations, runCommand };
}
