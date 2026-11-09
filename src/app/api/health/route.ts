import { NextResponse } from "next/server";

import { getMissingPipelineVariables, getMissingServiceVariables, getServiceConfig } from "@/lib/config";
import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

const requiredTables = [
  "profiles",
  "projects",
  "teams",
  "team_members",
  "test_runs",
  "team_join_requests",
  "project_repositories",
  "agent_pipelines",
  "agent_pipeline_events",
  "agent_artifacts",
  "agent_reviews",
] as const;

async function checkDatabase() {
  const rows = await getDb().execute<{ table_name: string }>(sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (${sql.join(requiredTables.map((table) => sql`${table}`), sql`, `)})
  `);
  const present = new Set(rows.map((row) => row.table_name));
  return {
    ready: requiredTables.every((table) => present.has(table)),
    missingTables: requiredTables.filter((table) => !present.has(table)),
  };
}

export async function GET() {
  const missing = getMissingServiceVariables();
  let database = { ready: false, missingTables: [] as string[] };
  let databaseError = false;

  if (!missing.includes("DATABASE_URL")) {
    try {
      database = await checkDatabase();
    } catch {
      databaseError = true;
    }
  }

  const databaseReady = !missing.includes("DATABASE_URL") && database.ready && !databaseError;
  return NextResponse.json({
    status: missing.length === 0 && databaseReady ? "ready" : "configuration_required",
    services: { ...getServiceConfig(), database: databaseReady, agentPipeline: getMissingPipelineVariables().length === 0 },
    agentPipeline: { missing: getMissingPipelineVariables() },
    missing: [...missing, ...database.missingTables.map((table) => `database table: ${table}`)],
    database: {
      connected: databaseReady,
      schemaReady: databaseReady && database.missingTables.length === 0,
      missingTables: database.missingTables,
      error: databaseError,
    },
  }, { status: missing.length === 0 && databaseReady ? 200 : 503 });
}
