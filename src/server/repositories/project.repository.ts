import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import type { Project, ProjectSummary } from "@/domain/projects/types";
import { getDb } from "@/lib/db/client";
import { projectRepositories, projects, testRuns } from "@/lib/db/schema";

const projectColumns = {
  id: projects.id,
  organizationId: projects.teamId,
  name: projects.name,
  targetUrl: projects.targetUrl,
  createdAt: projects.createdAt,
};

export const projectRepository = {
  async findById(projectId: string): Promise<Project | null> {
    const [row] = await getDb().select(projectColumns).from(projects).where(eq(projects.id, projectId)).limit(1);
    return row ?? null;
  },

  async findInOrganization(organizationId: string, projectId: string): Promise<Project | null> {
    const [row] = await getDb()
      .select(projectColumns)
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.teamId, organizationId)))
      .limit(1);
    return row ?? null;
  },

  async insert(input: { organizationId: string; ownerId: string; name: string; targetUrl: string }): Promise<Project> {
    const [row] = await getDb()
      .insert(projects)
      .values({ teamId: input.organizationId, ownerId: input.ownerId, name: input.name, targetUrl: input.targetUrl })
      .returning(projectColumns);
    return row;
  },

  async delete(organizationId: string, projectId: string): Promise<boolean> {
    const rows = await getDb()
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.teamId, organizationId)))
      .returning({ id: projects.id });
    return rows.length > 0;
  },

  /**
   * Projects with repository/run aggregates in one round trip. Correlated
   * subqueries hit the (project_id, created_at) indexes, so cost scales with
   * the page size rather than the total number of runs.
   */
  async listSummaries(organizationId: string, limit = 100): Promise<ProjectSummary[]> {
    const rows = await getDb()
      .select({
        ...projectColumns,
        repositoryCount: sql<number>`(select count(*)::int from ${projectRepositories} where ${projectRepositories.projectId} = ${projects.id})`,
        runCount: sql<number>`(select count(*)::int from ${testRuns} where ${testRuns.projectId} = ${projects.id})`,
        lastRunStatus: sql<string | null>`(select ${testRuns.status} from ${testRuns} where ${testRuns.projectId} = ${projects.id} order by ${testRuns.createdAt} desc limit 1)`,
        lastRunAt: sql<string | null>`(select ${testRuns.createdAt} from ${testRuns} where ${testRuns.projectId} = ${projects.id} order by ${testRuns.createdAt} desc limit 1)`,
      })
      .from(projects)
      .where(eq(projects.teamId, organizationId))
      .orderBy(desc(projects.createdAt))
      .limit(limit);
    return rows.map((row) => ({ ...row, lastRunAt: row.lastRunAt ? new Date(row.lastRunAt) : null }));
  },

  async countForOrganization(organizationId: string): Promise<number> {
    const [row] = await getDb().select({ value: count() }).from(projects).where(eq(projects.teamId, organizationId));
    return row?.value ?? 0;
  },
};
