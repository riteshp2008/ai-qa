import "server-only";

import { and, asc, desc, eq, gt, inArray, notInArray, sql } from "drizzle-orm";

import { terminalStatuses } from "@/domain/pipelines/lifecycle";
import type {
  AppProfile,
  Artifact,
  ArtifactKind,
  Pipeline,
  PipelineEvent,
  PipelineEventKind,
  PipelineResults,
  PipelineStatus,
  ReviewDecision,
  SuiteKind,
} from "@/domain/pipelines/types";
import { getDb } from "@/lib/db/client";
import { agentArtifacts, agentPipelineEvents, agentPipelines, agentReviews, profiles, projectRepositories } from "@/lib/db/schema";

const pipelineColumns = {
  id: agentPipelines.id,
  organizationId: agentPipelines.teamId,
  projectId: agentPipelines.projectId,
  repositoryId: agentPipelines.repositoryId,
  repositoryFullName: projectRepositories.fullName,
  status: agentPipelines.status,
  suites: agentPipelines.suites,
  instructions: agentPipelines.instructions,
  appProfile: agentPipelines.appProfile,
  results: agentPipelines.results,
  reviewRound: agentPipelines.reviewRound,
  prUrl: agentPipelines.prUrl,
  prNumber: agentPipelines.prNumber,
  prBranch: agentPipelines.prBranch,
  error: agentPipelines.error,
  createdAt: agentPipelines.createdAt,
  startedAt: agentPipelines.startedAt,
  completedAt: agentPipelines.completedAt,
};

function selectPipelines() {
  return getDb()
    .select(pipelineColumns)
    .from(agentPipelines)
    .innerJoin(projectRepositories, eq(projectRepositories.id, agentPipelines.repositoryId));
}

export type PipelineRecord = Pipeline & { baseBranch: string | null; sandboxId: string | null; defaultBranch: string };

export const pipelineRepository = {
  async insert(input: { organizationId: string; projectId: string; repositoryId: string; createdBy: string; suites: SuiteKind[]; instructions?: string }): Promise<{ id: string }> {
    const [row] = await getDb()
      .insert(agentPipelines)
      .values({
        teamId: input.organizationId,
        projectId: input.projectId,
        repositoryId: input.repositoryId,
        createdBy: input.createdBy,
        suites: input.suites,
        instructions: input.instructions ?? null,
      })
      .returning({ id: agentPipelines.id });
    return row;
  },

  async findInOrganization(organizationId: string, pipelineId: string): Promise<Pipeline | null> {
    const [row] = await selectPipelines()
      .where(and(eq(agentPipelines.id, pipelineId), eq(agentPipelines.teamId, organizationId)))
      .limit(1);
    return row ? { ...row, results: row.results ?? {} } : null;
  },

  /** Full record for the orchestrator (includes sandbox + branch internals). */
  async findForWorker(pipelineId: string): Promise<PipelineRecord | null> {
    const [row] = await getDb()
      .select({ ...pipelineColumns, baseBranch: agentPipelines.baseBranch, sandboxId: agentPipelines.sandboxId, defaultBranch: projectRepositories.defaultBranch })
      .from(agentPipelines)
      .innerJoin(projectRepositories, eq(projectRepositories.id, agentPipelines.repositoryId))
      .where(eq(agentPipelines.id, pipelineId))
      .limit(1);
    return row ? { ...row, results: row.results ?? {} } : null;
  },

  async listForProject(organizationId: string, projectId: string, limit = 20): Promise<Pipeline[]> {
    const rows = await selectPipelines()
      .where(and(eq(agentPipelines.teamId, organizationId), eq(agentPipelines.projectId, projectId)))
      .orderBy(desc(agentPipelines.createdAt))
      .limit(limit);
    return rows.map((row) => ({ ...row, results: row.results ?? {} }));
  },

  async hasActive(projectId: string): Promise<boolean> {
    const [row] = await getDb()
      .select({ id: agentPipelines.id })
      .from(agentPipelines)
      .where(and(eq(agentPipelines.projectId, projectId), notInArray(agentPipelines.status, [...terminalStatuses])))
      .limit(1);
    return Boolean(row);
  },

  async update(id: string, patch: Partial<{
    status: PipelineStatus;
    sandboxId: string | null;
    baseBranch: string;
    appProfile: AppProfile;
    reviewRound: number;
    prUrl: string;
    prNumber: number;
    prBranch: string;
    error: string | null;
    startedAt: Date;
    completedAt: Date;
  }>): Promise<void> {
    await getDb().update(agentPipelines).set({ ...patch, updatedAt: new Date() }).where(eq(agentPipelines.id, id));
  },

  /** Advances the workflow stage unless the pipeline already finished (e.g. was cancelled meanwhile). */
  async setStage(id: string, status: PipelineStatus, extra: { startedAt?: Date } = {}): Promise<boolean> {
    const rows = await getDb()
      .update(agentPipelines)
      .set({ status, updatedAt: new Date(), ...extra, ...(terminalStatuses.includes(status) ? { completedAt: new Date() } : {}) })
      .where(and(eq(agentPipelines.id, id), notInArray(agentPipelines.status, [...terminalStatuses])))
      .returning({ id: agentPipelines.id });
    return rows.length > 0;
  },

  /** Shallow-merges into the results JSON atomically (concurrent stages can't clobber each other). */
  async mergeResults(id: string, partial: PipelineResults): Promise<void> {
    await getDb()
      .update(agentPipelines)
      .set({ results: sql`${agentPipelines.results} || ${JSON.stringify(partial)}::jsonb`, updatedAt: new Date() })
      .where(eq(agentPipelines.id, id));
  },

  /** Moves to `status` only from one of `from` (guards against races with cancel/reject). */
  async transition(id: string, from: PipelineStatus[], status: PipelineStatus): Promise<boolean> {
    const rows = await getDb()
      .update(agentPipelines)
      .set({ status, updatedAt: new Date(), ...(terminalStatuses.includes(status) ? { completedAt: new Date() } : {}) })
      .where(and(eq(agentPipelines.id, id), inArray(agentPipelines.status, from)))
      .returning({ id: agentPipelines.id });
    return rows.length > 0;
  },
};

export const pipelineEventRepository = {
  async append(pipelineId: string, event: { agent: string; kind: PipelineEventKind; message: string; data?: Record<string, unknown> }): Promise<void> {
    await getDb().insert(agentPipelineEvents).values({ pipelineId, agent: event.agent, kind: event.kind, message: event.message, data: event.data ?? null });
  },

  async list(pipelineId: string, options: { afterId?: number; limit?: number } = {}): Promise<PipelineEvent[]> {
    const rows = await getDb()
      .select({ id: agentPipelineEvents.id, agent: agentPipelineEvents.agent, kind: agentPipelineEvents.kind, message: agentPipelineEvents.message, data: agentPipelineEvents.data, createdAt: agentPipelineEvents.createdAt })
      .from(agentPipelineEvents)
      .where(and(eq(agentPipelineEvents.pipelineId, pipelineId), options.afterId ? gt(agentPipelineEvents.id, options.afterId) : undefined))
      .orderBy(desc(agentPipelineEvents.id))
      .limit(Math.min(options.limit ?? 200, 500));
    return rows.reverse().map((row) => ({ ...row, data: (row.data as Record<string, unknown> | null) ?? null }));
  },
};

export const artifactRepository = {
  /** Replaces the pipeline's artifact set with the latest collected files. */
  async replaceAll(pipelineId: string, files: Array<{ path: string; content: string; kind: ArtifactKind; agent: string }>): Promise<void> {
    await getDb().transaction(async (tx) => {
      await tx.delete(agentArtifacts).where(eq(agentArtifacts.pipelineId, pipelineId));
      if (files.length) await tx.insert(agentArtifacts).values(files.map((file) => ({ ...file, pipelineId })));
    });
  },

  async list(pipelineId: string): Promise<Artifact[]> {
    return getDb()
      .select({ id: agentArtifacts.id, path: agentArtifacts.path, kind: agentArtifacts.kind, agent: agentArtifacts.agent, content: agentArtifacts.content, updatedAt: agentArtifacts.updatedAt })
      .from(agentArtifacts)
      .where(eq(agentArtifacts.pipelineId, pipelineId))
      .orderBy(asc(agentArtifacts.kind), asc(agentArtifacts.path));
  },
};

export type ReviewRecord = { id: string; decision: ReviewDecision; feedback: string | null; reviewer: string; createdAt: Date };

export const reviewRepository = {
  async insert(input: { pipelineId: string; decision: ReviewDecision; feedback?: string; decidedBy: string }): Promise<void> {
    await getDb().insert(agentReviews).values({ pipelineId: input.pipelineId, decision: input.decision, feedback: input.feedback ?? null, decidedBy: input.decidedBy });
  },

  async list(pipelineId: string): Promise<ReviewRecord[]> {
    const rows = await getDb()
      .select({ id: agentReviews.id, decision: agentReviews.decision, feedback: agentReviews.feedback, reviewer: profiles.email, createdAt: agentReviews.createdAt })
      .from(agentReviews)
      .leftJoin(profiles, eq(profiles.id, agentReviews.decidedBy))
      .where(eq(agentReviews.pipelineId, pipelineId))
      .orderBy(asc(agentReviews.createdAt));
    return rows.map((row) => ({ ...row, reviewer: row.reviewer ?? "A teammate" }));
  },
};
