import "server-only";

import { AppError } from "@/domain/errors";
import { isUuid } from "@/domain/ids";
import { linkRepositorySchema, type LinkedRepository } from "@/domain/repositories/github";
import { isUniqueViolation } from "@/lib/db/errors";
import { fetchGitHubRepository, GitHubRequestError } from "@/lib/github/client";
import { assertCan, type OrganizationContext } from "@/server/auth/organization-context";
import { linkedRepositoryRepository } from "@/server/repositories/linked-repository.repository";
import { parseInput } from "./validation";
import { projectService } from "./project.service";

const alreadyLinked = () =>
  new AppError("conflict", "Repository already linked.", { repository: ["This repository is already linked to the project."] });

export const repositoryLinkService = {
  async list(context: OrganizationContext, projectId: string): Promise<LinkedRepository[]> {
    const project = await projectService.get(context, projectId);
    return linkedRepositoryRepository.listForProject(project.id);
  },

  /** Verifies the repository on GitHub, then links it to the project. */
  async link(context: OrganizationContext, projectId: string, input: unknown): Promise<LinkedRepository> {
    assertCan(context.role, "repositories:link");
    const project = await projectService.get(context, projectId);
    const { repository } = parseInput(linkRepositorySchema, input);

    let metadata;
    try {
      metadata = await fetchGitHubRepository(repository.owner, repository.name);
    } catch (error) {
      if (error instanceof GitHubRequestError) throw new AppError("unavailable", error.message);
      throw error;
    }
    if (!metadata) {
      throw new AppError("not_found", "Repository not found.", {
        repository: ["GitHub couldn't find that repository. Private repositories need a GITHUB_TOKEN with access."],
      });
    }
    if (await linkedRepositoryRepository.exists(project.id, metadata.full_name)) throw alreadyLinked();

    try {
      return await linkedRepositoryRepository.insert({
        projectId: project.id,
        organizationId: context.organization.id,
        externalId: metadata.id,
        fullName: metadata.full_name,
        defaultBranch: metadata.default_branch,
        htmlUrl: metadata.html_url,
        description: metadata.description,
        isPrivate: metadata.private,
        linkedBy: context.user.id,
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw alreadyLinked();
      throw error;
    }
  },

  async unlink(context: OrganizationContext, linkId: string): Promise<void> {
    assertCan(context.role, "repositories:unlink");
    if (!isUuid(linkId) || !(await linkedRepositoryRepository.delete(context.organization.id, linkId))) {
      throw new AppError("not_found", "That repository is no longer linked.");
    }
  },
};
