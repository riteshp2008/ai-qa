import "server-only";

import { AppError } from "@/domain/errors";
import { isUuid } from "@/domain/ids";
import { isTerminal } from "@/domain/pipelines/lifecycle";
import {
  PIPELINE_CANCELLED_EVENT,
  PIPELINE_INPUT_EVENT,
  PIPELINE_REQUESTED_EVENT,
  PIPELINE_REVIEWED_EVENT,
} from "@/domain/pipelines/events";
import { environmentInputSchema, reviewPipelineSchema, startPipelineSchema } from "@/domain/pipelines/schemas";
import type { Artifact, Pipeline, PipelineEvent } from "@/domain/pipelines/types";
import { getMissingPipelineVariables } from "@/lib/config";
import { inngest } from "@/lib/inngest/client";
import { assertCan, type OrganizationContext } from "@/server/auth/organization-context";
import {
  artifactRepository,
  pipelineEventRepository,
  pipelineRepository,
  reviewRepository,
  type ReviewRecord,
} from "@/server/repositories/pipeline.repository";
import { linkedRepositoryRepository } from "@/server/repositories/linked-repository.repository";
import { projectService } from "./project.service";
import { parseInput } from "./validation";

async function requirePipeline(context: OrganizationContext, pipelineId: string): Promise<Pipeline> {
  const pipeline = isUuid(pipelineId) ? await pipelineRepository.findInOrganization(context.organization.id, pipelineId) : null;
  if (!pipeline) throw new AppError("not_found", "Pipeline not found.");
  return pipeline;
}

export const pipelineService = {
  /** Queues a new agentic test pipeline for one of the project's linked repositories. */
  async start(context: OrganizationContext, projectId: string, input: unknown): Promise<{ id: string }> {
    assertCan(context.role, "pipelines:run");
    const project = await projectService.get(context, projectId);
    const { repositoryId, suites, instructions } = parseInput(startPipelineSchema, input);

    const repositories = await linkedRepositoryRepository.listForProject(project.id);
    if (!repositories.some((repository) => repository.id === repositoryId)) {
      throw new AppError("validation", "Choose a repository linked to this project.", { repositoryId: ["Link the repository first."] });
    }
    const missing = getMissingPipelineVariables();
    if (missing.length) throw new AppError("unavailable", `The agent pipeline isn't configured yet. Missing: ${missing.join(", ")}.`);
    if (await pipelineRepository.hasActive(project.id)) {
      throw new AppError("conflict", "A pipeline is already running for this project. Wait for it to finish or cancel it.");
    }

    const pipeline = await pipelineRepository.insert({
      organizationId: context.organization.id,
      projectId: project.id,
      repositoryId,
      createdBy: context.user.id,
      suites,
      instructions,
    });
    await pipelineEventRepository.append(pipeline.id, { agent: "human", kind: "hitl", message: `${context.user.email} started a pipeline for ${suites.join(", ")} tests.` });
    await inngest.send({ name: PIPELINE_REQUESTED_EVENT, data: { pipelineId: pipeline.id, projectId: project.id, suites } });
    return pipeline;
  },

  get: requirePipeline,

  list(context: OrganizationContext, projectId: string): Promise<Pipeline[]> {
    return pipelineRepository.listForProject(context.organization.id, projectId);
  },

  async timeline(context: OrganizationContext, pipelineId: string): Promise<PipelineEvent[]> {
    await requirePipeline(context, pipelineId);
    return pipelineEventRepository.list(pipelineId);
  },

  async artifacts(context: OrganizationContext, pipelineId: string): Promise<Artifact[]> {
    await requirePipeline(context, pipelineId);
    return artifactRepository.list(pipelineId);
  },

  async reviews(context: OrganizationContext, pipelineId: string): Promise<ReviewRecord[]> {
    await requirePipeline(context, pipelineId);
    return reviewRepository.list(pipelineId);
  },

  /** Human-in-the-loop decision: approve (open PR), request changes (agents loop), or reject. */
  async review(context: OrganizationContext, pipelineId: string, input: unknown): Promise<void> {
    assertCan(context.role, "pipelines:approve");
    const pipeline = await requirePipeline(context, pipelineId);
    if (pipeline.status !== "awaiting_approval") throw new AppError("conflict", "This pipeline isn't waiting for approval.");
    const { decision, feedback } = parseInput(reviewPipelineSchema, input);

    await reviewRepository.insert({ pipelineId, decision, feedback, decidedBy: context.user.id });
    await pipelineEventRepository.append(pipelineId, {
      agent: "human",
      kind: "hitl",
      message: `${context.user.email} ${decision === "approve" ? "approved the tests" : decision === "reject" ? "rejected the tests" : "requested changes"}.${feedback ? ` “${feedback.slice(0, 300)}”` : ""}`,
    });
    await inngest.send({ name: PIPELINE_REVIEWED_EVENT, data: { pipelineId, decision, feedback } });
  },

  /** Human provides runtime configuration the app needs to boot. Values are never stored. */
  async provideEnvironment(context: OrganizationContext, pipelineId: string, input: unknown): Promise<void> {
    assertCan(context.role, "pipelines:run");
    const pipeline = await requirePipeline(context, pipelineId);
    if (pipeline.status !== "awaiting_input") throw new AppError("conflict", "This pipeline isn't waiting for configuration.");
    const { env } = parseInput(environmentInputSchema, input);
    await pipelineEventRepository.append(pipelineId, { agent: "human", kind: "hitl", message: `${context.user.email} provided ${Object.keys(env).length} configuration value(s): ${Object.keys(env).join(", ")}.` });
    await inngest.send({ name: PIPELINE_INPUT_EVENT, data: { pipelineId, env } });
  },

  async cancel(context: OrganizationContext, pipelineId: string): Promise<void> {
    assertCan(context.role, "pipelines:cancel");
    const pipeline = await requirePipeline(context, pipelineId);
    if (isTerminal(pipeline.status)) throw new AppError("conflict", "This pipeline has already finished.");
    await pipelineRepository.update(pipelineId, { status: "cancelled", completedAt: new Date() });
    await pipelineEventRepository.append(pipelineId, { agent: "human", kind: "hitl", message: `${context.user.email} cancelled the pipeline.` });
    await inngest.send({ name: PIPELINE_CANCELLED_EVENT, data: { pipelineId } });
  },
};
