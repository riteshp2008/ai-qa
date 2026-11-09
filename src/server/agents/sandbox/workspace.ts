import "server-only";

import { artifactKindFor, isAllowedInPullRequest } from "@/server/agents/guardrails/paths";
import { containsSecret } from "@/server/agents/guardrails/redact";
import type { ArtifactKind } from "@/domain/pipelines/types";
import { APP_ENV_FILE } from "@/server/agents/agents/containerizer";
import type { CommandOutcome, SandboxSession } from "./types";

/**
 * Clones the repository with a read-only token passed via env (never in the
 * command string), then strips credentials from the remote so nothing running
 * in the sandbox can reuse them.
 */
export async function cloneRepository(session: SandboxSession, fullName: string, token: string | undefined, branch?: string) {
  const url = token ? `https://x-access-token:$GIT_TOKEN@github.com/${fullName}.git` : `https://github.com/${fullName}.git`;
  const branchFlag = branch ? `--branch ${JSON.stringify(branch)} ` : "";
  const clone = await session.run(`git clone --depth 50 ${branchFlag}"${url}" ${session.repoDir}`, {
    cwd: "/home/user",
    timeoutMs: 5 * 60_000,
    envs: token ? { GIT_TOKEN: token } : {},
  });
  if (clone.exitCode !== 0) throw new Error(`git clone failed: ${clone.stderr.replace(/x-access-token:[^@]+@/g, "")}`);
  await session.run(`git remote set-url origin https://github.com/${fullName}.git && git config user.name "Sentinel" && git config user.email "sentinel@users.noreply.github.com"`);
}

export async function writeAppEnv(session: SandboxSession, env: Record<string, string>) {
  const lines = Object.entries(env).map(([key, value]) => `${key}=${value.replace(/\n/g, "\\n")}`);
  await session.run(`mkdir -p $(dirname ${APP_ENV_FILE}) && chmod 700 $(dirname ${APP_ENV_FILE})`, { cwd: "/home/user" });
  await session.writeFile(APP_ENV_FILE, `${lines.join("\n")}\n`);
}

/** Re-applies previously generated files (used when a revision round starts in a fresh sandbox). */
export async function restoreFiles(session: SandboxSession, files: Array<{ path: string; content: string }>) {
  for (const file of files) await session.writeFile(file.path, file.content);
}

export type CollectedChanges = {
  files: Array<{ path: string; content: string; kind: ArtifactKind }>;
  revertedPaths: string[];
};

const MAX_ARTIFACT_BYTES = 400_000;

/**
 * Final guardrail over the whole workspace diff: anything outside the PR
 * allowlist (e.g. application source) is reverted, and files that look like
 * they contain secrets are dropped. What remains becomes the PR content.
 */
export async function collectChanges(session: SandboxSession): Promise<CollectedChanges> {
  const status = await session.run("git status --porcelain --untracked-files=all -- . ':(exclude)node_modules' ':(exclude)**/node_modules/**' | head -2000");
  const files: CollectedChanges["files"] = [];
  const revertedPaths: string[] = [];

  for (const line of status.stdout.split("\n").filter(Boolean)) {
    const code = line.slice(0, 2);
    const path = line.slice(3).replace(/^"|"$/g, "").split(" -> ").pop()!;
    if (code.includes("D")) continue;

    if (!isAllowedInPullRequest(path)) {
      if (code !== "??") await session.run(`git checkout -- ${JSON.stringify(path)}`);
      revertedPaths.push(path);
      continue;
    }
    const size = await session.run(`wc -c < ${JSON.stringify(path)}`);
    if (Number(size.stdout.trim()) > MAX_ARTIFACT_BYTES) {
      revertedPaths.push(path);
      continue;
    }
    const content = await session.readFile(path);
    if (containsSecret(content) || content.includes("\u0000")) {
      revertedPaths.push(path);
      continue;
    }
    files.push({ path, content, kind: artifactKindFor(path) });
  }
  return { files, revertedPaths };
}

/**
 * Extracts pass/fail counts from common runner summaries (Playwright, Vitest,
 * Jest, pytest, go). Runners print the final summary last, so the last match
 * wins (Vitest prints "Test Files N passed" before "Tests N passed").
 */
export function parseTestCounts(output: string): { passed: number; failed: number } {
  const last = (pattern: RegExp) => {
    const matches = [...output.matchAll(pattern)];
    return matches.length ? Number(matches[matches.length - 1][1]) : 0;
  };
  const goPassed = (output.match(/^--- PASS/gm) ?? []).length;
  const goFailed = (output.match(/^--- FAIL/gm) ?? []).length;
  return {
    passed: Math.max(last(/(\d+)\s+passed/gi), goPassed),
    failed: Math.max(last(/(\d+)\s+failed/gi), goFailed),
  };
}

/** Independent re-run of a suite by the platform (agents' self-reports are not trusted blindly). */
export async function verifySuite(session: SandboxSession, command: string, envs: Record<string, string>): Promise<CommandOutcome & { passed: number; failed: number }> {
  const outcome = await session.run(command, { timeoutMs: 15 * 60_000, envs });
  return { ...outcome, ...parseTestCounts(`${outcome.stdout}\n${outcome.stderr}`) };
}
