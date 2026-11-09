import type { ReviewDecision, SuiteKind } from "./types";

export const PIPELINE_REQUESTED_EVENT = "sentinel/pipeline.requested" as const;
export const PIPELINE_REVIEWED_EVENT = "sentinel/pipeline.reviewed" as const;
export const PIPELINE_INPUT_EVENT = "sentinel/pipeline.input-provided" as const;
export const PIPELINE_CANCELLED_EVENT = "sentinel/pipeline.cancelled" as const;

export type PipelineRequestedData = { pipelineId: string; projectId: string; suites: SuiteKind[] };
export type PipelineReviewedData = { pipelineId: string; decision: ReviewDecision; feedback?: string };
/** Env values travel only in the event payload; they are never written to the database. */
export type PipelineInputData = { pipelineId: string; env: Record<string, string> };
