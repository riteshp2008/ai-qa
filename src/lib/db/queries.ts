import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { parsePageSize } from "@/lib/db/pagination";
import { teamInvites, teamMembers, teams } from "@/lib/db/schema";

export async function getTeamSnapshot(teamId: string, pageSize = 25) {
  const db = getDb();
  const limit = parsePageSize(String(pageSize));

  const [teamRows, members, invites] = await Promise.all([
    db.select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
    }).from(teams).where(eq(teams.id, teamId)).limit(1),
    db.select({
      user_id: teamMembers.userId,
      role: teamMembers.role,
      created_at: teamMembers.createdAt,
    }).from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(asc(teamMembers.createdAt))
      .limit(limit),
    db.select({
      id: teamInvites.id,
      email: teamInvites.email,
      role: teamInvites.role,
      status: teamInvites.status,
      expires_at: teamInvites.expiresAt,
      created_at: teamInvites.createdAt,
    }).from(teamInvites)
      .where(and(eq(teamInvites.teamId, teamId), eq(teamInvites.status, "pending")))
      .orderBy(asc(teamInvites.createdAt))
      .limit(limit),
  ]);

  return {
    team: teamRows[0] ?? null,
    members,
    invites,
  };
}
