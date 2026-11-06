import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { getServerEnv } from "@/lib/config";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

function createSqlClient() {
  return postgres(getServerEnv("DATABASE_URL"), {
    max: 5,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export function getDb() {
  const sql = globalForDb.sql ?? createSqlClient();
  if (process.env.NODE_ENV !== "production") {
    globalForDb.sql = sql;
  }
  return drizzle(sql, { schema });
}
