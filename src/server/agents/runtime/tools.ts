import "server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod";

import type { AgentName } from "@/domain/pipelines/types";
import { tail, truncateMiddle } from "@/server/agents/context/budget";
import { checkCommand, isDependencyInstall } from "@/server/agents/guardrails/commands";
import { checkReadable, checkWritable } from "@/server/agents/guardrails/paths";
import { containsSecret, redactSecrets } from "@/server/agents/guardrails/redact";
import type { SandboxSession } from "@/server/agents/sandbox";
import type { AgentEventSink, GuardrailCounter } from "./events";
import type { AsyncLock } from "./lock";

export type ToolContext = {
  agent: AgentName;
  session: SandboxSession;
  sink: AgentEventSink;
  installLock: AsyncLock;
  guardrails: GuardrailCounter;
  /** Values that must never appear in model context or logs (e.g. human-provided env). */
  secrets: readonly string[];
  /** Extra env for commands (e.g. BASE_URL of the running app). */
  envs?: Record<string, string>;
  /** Files this agent created or changed; becomes its artifacts. */
  writtenFiles: Set<string>;
};

const MAX_OUTPUT = 6000;
const MAX_FILE_READ = 14_000;
const MAX_FILE_WRITE = 120_000;

const quote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

async function blocked(context: ToolContext, action: string, reason: string) {
  context.guardrails.blocked += 1;
  await context.sink.emit(context.agent, "guardrail", `Blocked ${action}: ${reason}`);
  return `BLOCKED by guardrail: ${reason}`;
}

/**
 * The only way agents touch the sandbox. Every call is policy-checked,
 * output is truncated and secret-redacted before the model sees it, and
 * activity is streamed to the pipeline timeline.
 */
export function createSandboxTools(context: ToolContext) {
  const clean = (text: string) => redactSecrets(text, context.secrets);

  const listFiles = tool(
    async ({ path, depth }) => {
      const check = checkReadable(path === "." ? "./x" : path);
      if (path !== "." && !check.ok) return blocked(context, `list ${path}`, check.reason);
      const target = path === "." ? "." : (check as { path: string }).path;
      const result = await context.session.run(
        `find ${quote(target)} -maxdepth ${depth} -not -path '*/node_modules*' -not -path '*/.git/*' -not -name '.env*' | sort | head -400`,
      );
      return clean(result.stdout || result.stderr || "(empty)");
    },
    {
      name: "list_files",
      description: "List files and folders under a repository path (relative to the repo root).",
      schema: z.object({ path: z.string().default("."), depth: z.number().int().min(1).max(5).default(2) }),
    },
  );

  const readFile = tool(
    async ({ path, startLine, maxLines }) => {
      const check = checkReadable(path);
      if (!check.ok) return blocked(context, `read ${path}`, check.reason);
      if (!(await context.session.exists(check.path))) return `File not found: ${check.path}`;
      const lines = (await context.session.readFile(check.path)).split("\n");
      const slice = lines.slice(startLine - 1, startLine - 1 + maxLines);
      const numbered = slice.map((line, index) => `${startLine + index}: ${line}`).join("\n");
      const more = startLine - 1 + maxLines < lines.length ? `\n… ${lines.length - (startLine - 1 + maxLines)} more lines (use startLine)` : "";
      return clean(truncateMiddle(numbered, MAX_FILE_READ) + more);
    },
    {
      name: "read_file",
      description: "Read a text file from the repository with line numbers.",
      schema: z.object({ path: z.string(), startLine: z.number().int().min(1).default(1), maxLines: z.number().int().min(1).max(600).default(300) }),
    },
  );

  const searchCode = tool(
    async ({ pattern, path }) => {
      const check = checkReadable(path === "." ? "./x" : path);
      if (path !== "." && !check.ok) return blocked(context, `search ${path}`, check.reason);
      const result = await context.session.run(
        `grep -rIn --exclude-dir=node_modules --exclude-dir=.git --exclude='.env*' -e ${quote(pattern)} ${quote(path)} | head -120`,
      );
      return clean(truncateMiddle(result.stdout || "No matches.", MAX_OUTPUT));
    },
    {
      name: "search_code",
      description: "Search the repository with grep (basic regex). Returns file:line:match.",
      schema: z.object({ pattern: z.string().min(1).max(200), path: z.string().default(".") }),
    },
  );

  const writeFile = tool(
    async ({ path, content }) => {
      const check = checkWritable(context.agent, path);
      if (!check.ok) return blocked(context, `write ${path}`, check.reason);
      if (content.length > MAX_FILE_WRITE) return blocked(context, `write ${check.path}`, "File is too large.");
      if (containsSecret(content) || context.secrets.some((secret) => secret.length >= 4 && content.includes(secret))) {
        return blocked(context, `write ${check.path}`, "Content looks like it contains a credential. Use environment variables instead.");
      }
      await context.session.writeFile(check.path, content);
      context.writtenFiles.add(check.path);
      await context.sink.emit(context.agent, "tool", `Wrote ${check.path}`, { lines: content.split("\n").length });
      return `Wrote ${check.path} (${content.length} chars).`;
    },
    {
      name: "write_file",
      description: "Create or overwrite a file. You may only write files your role allows (tests/config), never application source.",
      schema: z.object({ path: z.string(), content: z.string() }),
    },
  );

  const runCommand = tool(
    async ({ command, timeoutSeconds }) => {
      const check = checkCommand(context.agent, command);
      if (!check.ok) return blocked(context, `command "${command.slice(0, 80)}"`, check.reason);
      const execute = () => context.session.run(command, { timeoutMs: timeoutSeconds * 1000, envs: context.envs });
      const result = isDependencyInstall(command) ? await context.installLock.run(execute) : await execute();
      await context.sink.emit(context.agent, "tool", `$ ${clean(command).slice(0, 160)}`, { exitCode: result.exitCode, timedOut: result.timedOut });
      return clean(
        [
          `exit code: ${result.exitCode}${result.timedOut ? " (timed out)" : ""}`,
          result.stdout && `stdout:\n${tail(result.stdout, MAX_OUTPUT)}`,
          result.stderr && `stderr:\n${tail(result.stderr, MAX_OUTPUT / 2)}`,
        ].filter(Boolean).join("\n"),
      );
    },
    {
      name: "run_command",
      description: "Run a shell command in the repository root inside the sandbox. Output is truncated to the tail.",
      schema: z.object({ command: z.string().min(1), timeoutSeconds: z.number().int().min(5).max(900).default(180) }),
    },
  );

  return [listFiles, readFile, searchCode, writeFile, runCommand];
}
