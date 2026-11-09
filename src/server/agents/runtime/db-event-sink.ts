import "server-only";

import type { AgentName, PipelineEventKind } from "@/domain/pipelines/types";
import { redactSecrets } from "@/server/agents/guardrails/redact";
import { pipelineEventRepository } from "@/server/repositories/pipeline.repository";
import type { AgentEventSink } from "./events";

/** Persists agent activity to the pipeline timeline, redacting secrets first. Never throws. */
export function createDbEventSink(pipelineId: string, secrets: readonly string[] = []): AgentEventSink {
  return {
    async emit(agent: AgentName, kind: PipelineEventKind, message: string, data?: Record<string, unknown>) {
      try {
        const safeData = data ? (JSON.parse(redactSecrets(JSON.stringify(data), secrets)) as Record<string, unknown>) : undefined;
        await pipelineEventRepository.append(pipelineId, { agent, kind, message: redactSecrets(message, secrets).slice(0, 2000), data: safeData });
      } catch (error) {
        console.error("Failed to record pipeline event.", error);
      }
    },
  };
}
