import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import type { TestRunStatus } from "@/domain/test-runs/lifecycle";
import type { TestRunSummary } from "@/domain/test-runs/types";
import { getDb } from "@/lib/db/client";
import { projects, testRuns } from "@/lib/db/schema";

const summaryColumns = {
  id: testRuns.id,
  projectId: testRuns.projectId,
  projectName: projects.name,
  status: sql<TestRunStatus>`${testRuns.status}`,
  instruction: testRuns.instruction,
  targetUrl: testRuns.targetUrl,
  createdAt: testRuns.createdAt,
  completedAt: testRuns.completedAt,
};

export type RunStatusCounts = Record<"total" | "passed" | "failed" | "needsReview" | "active", number>;

export const testRunRepository = {
  async listForOrganization(
    organizationId: string,
    options: { projectId?: string; limit?: number } = {},
  ): Promise<TestRunSummary[]> {
    return getDb()
      .select(summaryColumns)
      .from(testRuns)
      .innerJoin(projects, eq(projects.id, testRuns.projectId))
      .where(and(
        eq(projects.teamId, organizationId),
        options.projectId ? eq(testRuns.projectId, options.projectId) : undefined,
      ))
      .orderBy(desc(testRuns.createdAt))
      .limit(Math.min(options.limit ?? 25, 100));
  },

  async statusCounts(organizationId: string): Promise<RunStatusCounts> {
    const [row] = await getDb()
      .select({
        total: sql<number>`count(*)::int`,
        passed: sql<number>`count(*) filter (where ${testRuns.status} = 'passed')::int`,
        failed: sql<number>`count(*) filter (where ${testRuns.status} = 'failed')::int`,
        needsReview: sql<number>`count(*) filter (where ${testRuns.status} = 'needs_review')::int`,
        active: sql<number>`count(*) filter (where ${testRuns.status} in ('queued', 'running', 'retry_wait'))::int`,
      })
      .from(testRuns)
      .innerJoin(projects, eq(projects.id, testRuns.projectId))
      .where(eq(projects.teamId, organizationId));
    return row ?? { total: 0, passed: 0, failed: 0, needsReview: 0, active: 0 };
  },
};
