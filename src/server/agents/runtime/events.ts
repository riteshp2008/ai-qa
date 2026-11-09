import type { AgentName, PipelineEventKind } from "@/domain/pipelines/types";

/** Where agents report what they're doing. The pipeline persists these as its timeline. */
export interface AgentEventSink {
  emit(agent: AgentName, kind: PipelineEventKind, message: string, data?: Record<string, unknown>): Promise<void>;
}

/** Counts guardrail interventions so they can be surfaced in results and to reviewers. */
export class GuardrailCounter {
  blocked = 0;
}
