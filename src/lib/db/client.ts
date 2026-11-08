import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { getServerEnv } from "@/lib/config";

function createDatabase() {
  const sql = postgres(getServerEnv("DATABASE_URL"), {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** Either the root database handle or an open transaction. */
export type DbExecutor = Database | Transaction;

const globalForDb = globalThis as unknown as { sentinelDb?: Database };

/** Returns a process-wide Drizzle instance backed by a pooled connection. */
export function getDb(): Database {
  if (!globalForDb.sentinelDb) {
    globalForDb.sentinelDb = createDatabase();
  }
  return globalForDb.sentinelDb;
}
