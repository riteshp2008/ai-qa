import "server-only";

import { cache } from "react";

import { can } from "@/domain/organizations/roles";
import type { OrganizationContext } from "@/server/auth/organization-context";
import { joinRequestRepository } from "@/server/repositories/join-request.repository";
import { linkedRepositoryRepository } from "@/server/repositories/linked-repository.repository";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { testRunRepository } from "@/server/repositories/test-run.repository";

/**
 * Aggregate counts for an organization, memoized per request so the stats row
 * and the setup checklist (rendered in separate Suspense boundaries) share
 * one set of queries.
 */
const loadCounts = cache(async (organizationId: string) => {
  const [projectCount, repositoryCount, memberCount, runCounts] = await Promise.all([
    projectRepository.countForOrganization(organizationId),
    linkedRepositoryRepository.countForOrganization(organizationId),
    organizationRepository.countMembers(organizationId),
    testRunRepository.statusCounts(organizationId),
  ]);
  return { projectCount, repositoryCount, memberCount, runCounts };
});

export type OrganizationStats = Awaited<ReturnType<typeof loadCounts>> & { passRate: number | null };
export type SetupStep = { key: "project" | "repository" | "team" | "run"; done: boolean };

/** Read models for the organization home page. */
export const overviewService = {
  async stats(context: OrganizationContext): Promise<OrganizationStats> {
    const counts = await loadCounts(context.organization.id);
    const completed = counts.runCounts.passed + counts.runCounts.failed;
    return { ...counts, passRate: completed ? Math.round((counts.runCounts.passed / completed) * 100) : null };
  },

  async setup(context: OrganizationContext): Promise<SetupStep[]> {
    const counts = await loadCounts(context.organization.id);
    return [
      { key: "project", done: counts.projectCount > 0 },
      { key: "repository", done: counts.repositoryCount > 0 },
      { key: "team", done: counts.memberCount > 1 },
      { key: "run", done: counts.runCounts.total > 0 },
    ];
  },

  recentRuns(context: OrganizationContext, limit = 6) {
    return testRunRepository.listForOrganization(context.organization.id, { limit });
  },

  /** Badge count for navigation; zero for people who can't review. */
  pendingJoinRequests(context: OrganizationContext) {
    return can(context.role, "join-requests:review")
      ? joinRequestRepository.countPendingForOrganization(context.organization.id)
      : Promise.resolve(0);
  },
};
