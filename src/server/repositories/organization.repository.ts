import "server-only";

import { and, asc, count, eq, inArray } from "drizzle-orm";

import type { OrganizationRole } from "@/domain/organizations/roles";
import type { Member, Organization, OrganizationMembership } from "@/domain/organizations/types";
import { getDb, type DbExecutor } from "@/lib/db/client";
import { profiles, teamMembers, teams } from "@/lib/db/schema";

const organizationColumns = {
  id: teams.id,
  name: teams.name,
  slug: teams.slug,
  createdAt: teams.createdAt,
};

export const organizationRepository = {
  async findById(id: string, db: DbExecutor = getDb()): Promise<Organization | null> {
    const [row] = await db.select(organizationColumns).from(teams).where(eq(teams.id, id)).limit(1);
    return row ?? null;
  },

  async findBySlug(slug: string, db: DbExecutor = getDb()): Promise<Organization | null> {
    const [row] = await db.select(organizationColumns).from(teams).where(eq(teams.slug, slug)).limit(1);
    return row ?? null;
  },

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await getDb().select({ id: teams.id }).from(teams).where(eq(teams.slug, slug)).limit(1);
    return Boolean(row);
  },

  async insert(input: { name: string; slug: string; createdBy: string }, db: DbExecutor = getDb()): Promise<Organization> {
    const [row] = await db.insert(teams).values(input).returning(organizationColumns);
    return row;
  },

  async updateName(id: string, name: string): Promise<void> {
    await getDb().update(teams).set({ name }).where(eq(teams.id, id));
  },

  async listMembershipsForUser(userId: string): Promise<OrganizationMembership[]> {
    const rows = await getDb()
      .select({ organization: organizationColumns, role: teamMembers.role })
      .from(teamMembers)
      .innerJoin(teams, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.userId, userId))
      .orderBy(asc(teams.name));
    return rows;
  },

  async findMembership(userId: string, organizationId: string, db: DbExecutor = getDb()): Promise<OrganizationRole | null> {
    const [row] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, organizationId)))
      .limit(1);
    return row?.role ?? null;
  },

  /** Inserts a membership; an existing membership is left untouched. */
  async addMember(input: { organizationId: string; userId: string; role: OrganizationRole }, db: DbExecutor = getDb()) {
    await db
      .insert(teamMembers)
      .values({ teamId: input.organizationId, userId: input.userId, role: input.role })
      .onConflictDoNothing();
  },

  async removeMember(organizationId: string, userId: string): Promise<void> {
    await getDb()
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, organizationId), eq(teamMembers.userId, userId)));
  },

  async listMembers(organizationId: string, limit = 200): Promise<Member[]> {
    const rows = await getDb()
      .select({
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.createdAt,
        email: profiles.email,
        name: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(teamMembers)
      .leftJoin(profiles, eq(profiles.id, teamMembers.userId))
      .where(eq(teamMembers.teamId, organizationId))
      .orderBy(asc(teamMembers.createdAt))
      .limit(limit);
    return rows.map((row) => ({ ...row, email: row.email ?? "Unknown member" }));
  },

  async countOwners(organizationId: string): Promise<number> {
    const [row] = await getDb()
      .select({ value: count() })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, organizationId), eq(teamMembers.role, "owner")));
    return row?.value ?? 0;
  },

  /** Emails of everyone who may review join requests. */
  async listReviewerEmails(organizationId: string): Promise<string[]> {
    const rows = await getDb()
      .select({ email: profiles.email })
      .from(teamMembers)
      .innerJoin(profiles, eq(profiles.id, teamMembers.userId))
      .where(and(eq(teamMembers.teamId, organizationId), inArray(teamMembers.role, ["owner", "admin"])));
    return rows.map((row) => row.email).filter(Boolean);
  },
};
