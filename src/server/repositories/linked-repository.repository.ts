import "server-only";

import { and, asc, count, eq } from "drizzle-orm";

import type { LinkedRepository } from "@/domain/repositories/github";
import { getDb } from "@/lib/db/client";
import { projectRepositories } from "@/lib/db/schema";

const linkedRepositoryColumns = {
  id: projectRepositories.id,
  projectId: projectRepositories.projectId,
  provider: projectRepositories.provider,
  fullName: projectRepositories.fullName,
  defaultBranch: projectRepositories.defaultBranch,
  htmlUrl: projectRepositories.htmlUrl,
  description: projectRepositories.description,
  isPrivate: projectRepositories.isPrivate,
  createdAt: projectRepositories.createdAt,
};

export const linkedRepositoryRepository = {
  async listForProject(projectId: string): Promise<LinkedRepository[]> {
    return getDb()
      .select(linkedRepositoryColumns)
      .from(projectRepositories)
      .where(eq(projectRepositories.projectId, projectId))
      .orderBy(asc(projectRepositories.createdAt))
      .limit(100);
  },

  async exists(projectId: string, fullName: string): Promise<boolean> {
    const [row] = await getDb()
      .select({ id: projectRepositories.id })
      .from(projectRepositories)
      .where(and(eq(projectRepositories.projectId, projectId), eq(projectRepositories.fullName, fullName)))
      .limit(1);
    return Boolean(row);
  },

  async insert(input: {
    projectId: string;
    organizationId: string;
    externalId: number;
    fullName: string;
    defaultBranch: string;
    htmlUrl: string;
    description: string | null;
    isPrivate: boolean;
    linkedBy: string;
  }): Promise<LinkedRepository> {
    const [row] = await getDb()
      .insert(projectRepositories)
      .values({ ...input, teamId: input.organizationId, provider: "github" })
      .returning(linkedRepositoryColumns);
    return row;
  },

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rows = await getDb()
      .delete(projectRepositories)
      .where(and(eq(projectRepositories.id, id), eq(projectRepositories.teamId, organizationId)))
      .returning({ id: projectRepositories.id });
    return rows.length > 0;
  },

  async countForOrganization(organizationId: string): Promise<number> {
    const [row] = await getDb()
      .select({ value: count() })
      .from(projectRepositories)
      .where(eq(projectRepositories.teamId, organizationId));
    return row?.value ?? 0;
  },
};
