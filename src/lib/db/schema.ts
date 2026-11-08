import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Drizzle mirror of the Supabase migrations in `supabase/migrations`.
 * Migrations remain the source of truth; keep this file in sync with them.
 *
 * The `teams` tables back what the product calls "organizations".
 */

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("teams_slug_key").on(table.slug),
]);

export const teamMembers = pgTable("team_members", {
  teamId: uuid("team_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: text("role").$type<"owner" | "admin" | "member">().notNull(),
  createdAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.teamId, table.userId] }),
  index("team_members_user_id").on(table.userId),
]);

export const teamInvites = pgTable("team_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<"admin" | "member">().notNull(),
  tokenHash: text("token_hash").notNull(),
  invitedBy: uuid("invited_by").notNull(),
  status: text("status").$type<"pending" | "accepted" | "revoked" | "expired">().notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("team_invites_token_hash_key").on(table.tokenHash),
  index("team_invites_team_status").on(table.teamId, table.status),
]);

export const teamJoinRequests = pgTable("team_join_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  userId: uuid("user_id").notNull(),
  message: text("message"),
  status: text("status").$type<"pending" | "approved" | "rejected" | "cancelled">().notNull().default("pending"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  index("team_join_requests_team_status_idx").on(table.teamId, table.status, table.createdAt),
  index("team_join_requests_user_idx").on(table.userId, table.createdAt),
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  targetUrl: text("target_url").notNull(),
  createdAt: createdAt(),
}, (table) => [
  index("projects_team_created_idx").on(table.teamId, table.createdAt),
]);

export const projectRepositories = pgTable("project_repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  teamId: uuid("team_id").notNull(),
  provider: text("provider").$type<"github">().notNull().default("github"),
  externalId: bigint("external_id", { mode: "number" }),
  fullName: text("full_name").notNull(),
  defaultBranch: text("default_branch").notNull(),
  htmlUrl: text("html_url").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").notNull().default(false),
  linkedBy: uuid("linked_by").notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("project_repositories_project_id_provider_full_name_key").on(table.projectId, table.provider, table.fullName),
  index("project_repositories_project_idx").on(table.projectId, table.createdAt),
  index("project_repositories_team_idx").on(table.teamId),
]);

export const testRuns = pgTable("test_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  status: text("status").notNull(),
  instruction: text("instruction").notNull(),
  targetUrl: text("target_url").notNull(),
  currentAttempt: integer("current_attempt").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("test_runs_project_created_idx").on(table.projectId, table.createdAt),
]);

export const repositoryDocuments = pgTable("repository_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  projectId: uuid("project_id"),
  repositoryFullName: text("repository_full_name").notNull(),
  path: text("path").notNull(),
  revision: text("revision").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: createdAt(),
}, (table) => [
  index("repository_documents_lookup_idx").on(table.teamId, table.repositoryFullName, table.revision),
  uniqueIndex("repository_documents_path_revision_key").on(table.repositoryFullName, table.revision, table.path),
]);
