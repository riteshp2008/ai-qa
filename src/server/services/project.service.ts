import "server-only";

import { AppError } from "@/domain/errors";
import { isUuid } from "@/domain/ids";
import { createProjectSchema } from "@/domain/projects/request";
import type { Project, ProjectSummary } from "@/domain/projects/types";
import { assertCan, type OrganizationContext } from "@/server/auth/organization-context";
import { projectRepository } from "@/server/repositories/project.repository";
import { parseInput } from "./validation";

export const projectService = {
  list(context: OrganizationContext): Promise<ProjectSummary[]> {
    return projectRepository.listSummaries(context.organization.id);
  },

  /** Returns the project only if it belongs to the caller's organization. */
  async get(context: OrganizationContext, projectId: string): Promise<Project> {
    const project = isUuid(projectId) ? await projectRepository.findInOrganization(context.organization.id, projectId) : null;
    if (!project) throw new AppError("not_found", "Project not found.");
    return project;
  },

  async create(context: OrganizationContext, input: unknown): Promise<Project> {
    assertCan(context.role, "projects:create");
    const { name, targetUrl } = parseInput(createProjectSchema, input);
    return projectRepository.insert({ organizationId: context.organization.id, ownerId: context.user.id, name, targetUrl });
  },

  async delete(context: OrganizationContext, projectId: string): Promise<void> {
    assertCan(context.role, "projects:delete");
    if (!isUuid(projectId) || !(await projectRepository.delete(context.organization.id, projectId))) {
      throw new AppError("not_found", "Project not found.");
    }
  },
};
