import "server-only";

import { z } from "zod";

import type { AppProfile, ContainerResult } from "@/domain/pipelines/types";
import { runAgentLoop } from "@/server/agents/runtime/agent-loop";
import { createSandboxTools, type ToolContext } from "@/server/agents/runtime/tools";
import { sharedRules } from "./prompts";

export const CONTAINER_NAME = "sentinel-app";
export const APP_ENV_FILE = "/home/user/.sentinel/app.env";

const reportSchema = z.object({
  status: z.enum(["running", "failed"]),
  port: z.number().int().describe("Host port the app answers on"),
  createdDockerfile: z.boolean(),
  attempts: z.number().int().describe("How many build/run attempts you made"),
  summary: z.string(),
  missingEnv: z.array(z.string()).describe("Env var names the app needs that were not provided (names only)"),
});

/**
 * Containerizer: makes the repository run in Docker. Writes a Dockerfile when
 * none exists, then loops build → run → health-check → read logs → fix.
 */
export async function runContainerizer(context: Omit<ToolContext, "agent">, profile: AppProfile, hasEnvFile: boolean): Promise<ContainerResult> {
  const tools = createSandboxTools({ ...context, agent: "containerizer" });
  const envFlag = hasEnvFile ? `--env-file ${APP_ENV_FILE} ` : "";

  const { report, iterations, stopReason } = await runAgentLoop({
    agent: "containerizer",
    sink: context.sink,
    tools,
    reportSchema,
    maxIterations: 24,
    maxDurationMs: 20 * 60_000,
    systemPrompt: `${sharedRules("containerizer")}

Your job: get the application running in Docker inside this sandbox and answering HTTP on a host port.
Docker requires sudo. Container name: ${CONTAINER_NAME}.`,
    task: `Application profile from the repo analyst:
${JSON.stringify(profile, null, 2)}

Steps:
1. ${profile.hasDockerfile ? "A Dockerfile exists. Use it as-is unless it fails; if it must change, make minimal fixes." : "There is no Dockerfile. Write a production-ready Dockerfile (pinned official base image, non-root user, layer-cached dependency install, EXPOSE the port) and a .dockerignore (node_modules, .git, .env*, build output)."}
2. Build: sudo docker build -t ${CONTAINER_NAME} . 2>&1 | tail -60   (allow up to 900s)
3. Run: sudo docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1; sudo docker run -d --name ${CONTAINER_NAME} ${envFlag}-e PORT=${profile.port} -p ${profile.port}:${profile.port} ${CONTAINER_NAME}
4. Health check: curl -s -o /dev/null -w '%{http_code}' --retry 20 --retry-delay 3 --retry-connrefused http://localhost:${profile.port}${profile.healthPath}
5. If anything fails: sudo docker logs ${CONTAINER_NAME} --tail 120, diagnose, fix the Dockerfile, and retry. Max ~5 attempts.
6. If the app cannot start because required configuration is missing (database URL, API keys…), stop and report status "failed" with missingEnv listing the variable NAMES. Do not invent credentials.
${hasEnvFile ? "A human provided runtime configuration via the env file above; it is already wired into step 3." : ""}`,
  });

  if (!report) {
    return { status: "failed", createdDockerfile: context.writtenFiles.has("Dockerfile"), appUrl: null, attempts: iterations, summary: `Containerizer stopped (${stopReason}).`, missingEnv: [] };
  }
  return {
    status: report.status,
    createdDockerfile: report.createdDockerfile,
    appUrl: report.status === "running" ? `http://localhost:${report.port}` : null,
    attempts: report.attempts,
    summary: report.summary,
    missingEnv: report.missingEnv,
  };
}
