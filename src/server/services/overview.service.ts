import "server-only";

import { can } from "@/domain/organizations/roles";
import type { OrganizationContext } from "@/server/auth/organization-context";
import { joinRequestRepository } from "@/server/repositories/join-request.repository";
import { linkedRepositoryRepository } from "@/server/repositories/linked-repository.repository";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { testRunRepository } from "@/server/repositories/test-run.repository";

export type OrganizationOverview = Awaited<ReturnType<typeof overviewService.get>>;

/** Read model for the organization home page: counts plus setup progress. */
export const overviewService = {
  async get(context: OrganizationContext) {
    const organizationId = context.organization.id;
    const [projectCount, repositoryCount, runCounts, members, recentRuns] = await Promise.all([
      projectRepository.countForOrganization(organizationId),
      linkedRepositoryRepository.countForOrganization(organizationId),
      testRunRepository.statusCounts(organizationId),
      organizationRepository.listMembers(organizationId, 50),
      testRunRepository.listForOrganization(organizationId, { limit: 6 }),
    ]);

    return {
      projectCount,
      repositoryCount,
      memberCount: members.length,
      runCounts,
      recentRuns,
      setup: [
        { key: "project", done: projectCount > 0 },
        { key: "repository", done: repositoryCount > 0 },
        { key: "team", done: members.length > 1 },
        { key: "run", done: runCounts.total > 0 },
      ] as const,
    };
  },

  /** Badge count for the sidebar; zero for people who can't review. */
  pendingJoinRequests(context: OrganizationContext) {
    return can(context.role, "join-requests:review")
      ? joinRequestRepository.countPendingForOrganization(context.organization.id)
      : Promise.resolve(0);
  },
};
