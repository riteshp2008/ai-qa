import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { InviteRole } from "@/domain/organizations/roles";
import type { Invite } from "@/domain/organizations/types";
import { getDb, type DbExecutor } from "@/lib/db/client";
import { teamInvites } from "@/lib/db/schema";

const inviteColumns = {
  id: teamInvites.id,
  email: teamInvites.email,
  role: teamInvites.role,
  status: teamInvites.status,
  expiresAt: teamInvites.expiresAt,
  createdAt: teamInvites.createdAt,
};

export type InviteRecord = Invite & { organizationId: string };

export const inviteRepository = {
  async insert(input: {
    organizationId: string;
    email: string;
    role: InviteRole;
    tokenHash: string;
    invitedBy: string;
    expiresAt: Date;
  }): Promise<Invite> {
    const [row] = await getDb()
      .insert(teamInvites)
      .values({
        teamId: input.organizationId,
        email: input.email,
        role: input.role,
        tokenHash: input.tokenHash,
        invitedBy: input.invitedBy,
        expiresAt: input.expiresAt,
      })
      .returning(inviteColumns);
    return row;
  },

  async findByTokenHash(tokenHash: string): Promise<InviteRecord | null> {
    const [row] = await getDb()
      .select({ ...inviteColumns, organizationId: teamInvites.teamId })
      .from(teamInvites)
      .where(eq(teamInvites.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  },

  async findPendingByEmail(organizationId: string, email: string): Promise<Invite | null> {
    const [row] = await getDb()
      .select(inviteColumns)
      .from(teamInvites)
      .where(and(eq(teamInvites.teamId, organizationId), eq(teamInvites.email, email), eq(teamInvites.status, "pending")))
      .limit(1);
    return row ?? null;
  },

  async listPending(organizationId: string, limit = 50): Promise<Invite[]> {
    return getDb()
      .select(inviteColumns)
      .from(teamInvites)
      .where(and(eq(teamInvites.teamId, organizationId), eq(teamInvites.status, "pending")))
      .orderBy(asc(teamInvites.createdAt))
      .limit(limit);
  },

  async markAccepted(id: string, db: DbExecutor = getDb()): Promise<boolean> {
    const rows = await db
      .update(teamInvites)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(and(eq(teamInvites.id, id), eq(teamInvites.status, "pending")))
      .returning({ id: teamInvites.id });
    return rows.length > 0;
  },

  async revoke(organizationId: string, id: string): Promise<boolean> {
    const rows = await getDb()
      .update(teamInvites)
      .set({ status: "revoked" })
      .where(and(eq(teamInvites.id, id), eq(teamInvites.teamId, organizationId), eq(teamInvites.status, "pending")))
      .returning({ id: teamInvites.id });
    return rows.length > 0;
  },
};
