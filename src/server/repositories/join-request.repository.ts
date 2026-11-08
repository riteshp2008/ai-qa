import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";

import type {
  JoinRequest,
  JoinRequestStatus,
  OutgoingJoinRequest,
  PendingJoinRequest,
} from "@/domain/organizations/types";
import { getDb, type DbExecutor } from "@/lib/db/client";
import { profiles, teamJoinRequests, teams } from "@/lib/db/schema";

const joinRequestColumns = {
  id: teamJoinRequests.id,
  organizationId: teamJoinRequests.teamId,
  userId: teamJoinRequests.userId,
  message: teamJoinRequests.message,
  status: teamJoinRequests.status,
  createdAt: teamJoinRequests.createdAt,
  reviewedAt: teamJoinRequests.reviewedAt,
};

export const joinRequestRepository = {
  async findById(id: string, db: DbExecutor = getDb()): Promise<JoinRequest | null> {
    const [row] = await db.select(joinRequestColumns).from(teamJoinRequests).where(eq(teamJoinRequests.id, id)).limit(1);
    return row ?? null;
  },

  async findPending(organizationId: string, userId: string): Promise<JoinRequest | null> {
    const [row] = await getDb()
      .select(joinRequestColumns)
      .from(teamJoinRequests)
      .where(and(
        eq(teamJoinRequests.teamId, organizationId),
        eq(teamJoinRequests.userId, userId),
        eq(teamJoinRequests.status, "pending"),
      ))
      .limit(1);
    return row ?? null;
  },

  async insert(input: { organizationId: string; userId: string; message?: string }): Promise<JoinRequest> {
    const [row] = await getDb()
      .insert(teamJoinRequests)
      .values({ teamId: input.organizationId, userId: input.userId, message: input.message ?? null })
      .returning(joinRequestColumns);
    return row;
  },

  /**
   * Moves a pending request to a final status. Returns false when the request
   * was no longer pending (already reviewed or cancelled concurrently).
   */
  async resolve(
    id: string,
    status: Exclude<JoinRequestStatus, "pending">,
    reviewerId: string | null,
    db: DbExecutor = getDb(),
  ): Promise<boolean> {
    const rows = await db
      .update(teamJoinRequests)
      .set({ status, reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(and(eq(teamJoinRequests.id, id), eq(teamJoinRequests.status, "pending")))
      .returning({ id: teamJoinRequests.id });
    return rows.length > 0;
  },

  async listPendingForOrganization(organizationId: string, limit = 50): Promise<PendingJoinRequest[]> {
    const rows = await getDb()
      .select({ ...joinRequestColumns, requesterEmail: profiles.email, requesterName: profiles.fullName })
      .from(teamJoinRequests)
      .leftJoin(profiles, eq(profiles.id, teamJoinRequests.userId))
      .where(and(eq(teamJoinRequests.teamId, organizationId), eq(teamJoinRequests.status, "pending")))
      .orderBy(asc(teamJoinRequests.createdAt))
      .limit(limit);
    return rows.map(({ requesterEmail, requesterName, ...request }) => ({
      ...request,
      requester: { email: requesterEmail ?? "Unknown user", name: requesterName },
    }));
  },

  async countPendingForOrganization(organizationId: string): Promise<number> {
    const [row] = await getDb()
      .select({ value: count() })
      .from(teamJoinRequests)
      .where(and(eq(teamJoinRequests.teamId, organizationId), eq(teamJoinRequests.status, "pending")));
    return row?.value ?? 0;
  },

  async listForUser(userId: string, limit = 20): Promise<OutgoingJoinRequest[]> {
    const rows = await getDb()
      .select({ ...joinRequestColumns, organizationName: teams.name, organizationSlug: teams.slug })
      .from(teamJoinRequests)
      .innerJoin(teams, eq(teams.id, teamJoinRequests.teamId))
      .where(eq(teamJoinRequests.userId, userId))
      .orderBy(desc(teamJoinRequests.createdAt))
      .limit(limit);
    return rows.map(({ organizationName, organizationSlug, ...request }) => ({
      ...request,
      organization: { name: organizationName, slug: organizationSlug },
    }));
  },
};
