import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  slugIndex: uniqueIndex("teams_slug_key").on(table.slug),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey(),
  teamId: uuid("team_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  targetUrl: text("target_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  teamIndex: index("projects_team_id_idx").on(table.teamId),
}));

export const teamMembers = pgTable("team_members", {
  teamId: uuid("team_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  teamIndex: index("team_members_team_id_idx").on(table.teamId),
}));

export const teamInvites = pgTable("team_invites", {
  id: uuid("id").primaryKey(),
  teamId: uuid("team_id").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const testRuns = pgTable("test_runs", {
  id: uuid("id").primaryKey(),
  projectId: uuid("project_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  status: text("status").notNull(),
  instruction: text("instruction").notNull(),
  targetUrl: text("target_url").notNull(),
  currentAttempt: integer("current_attempt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => ({
  projectCreatedIndex: index("test_runs_project_created_idx").on(table.projectId, table.createdAt),
}));

export const repositoryDocuments = pgTable("repository_documents", {
  id: uuid("id").primaryKey(),
  teamId: uuid("team_id").notNull(),
  projectId: uuid("project_id"),
  repositoryFullName: text("repository_full_name").notNull(),
  path: text("path").notNull(),
  revision: text("revision").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
}, (table) => ({
  lookupIndex: index("repository_documents_lookup_idx").on(
    table.teamId,
    table.repositoryFullName,
    table.revision,
  ),
  pathRevisionIndex: uniqueIndex("repository_documents_path_revision_key").on(
    table.repositoryFullName,
    table.revision,
    table.path,
  ),
}));
