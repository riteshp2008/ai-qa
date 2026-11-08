/** Postgres unique_violation, unwrapping Drizzle's query error wrapper. */
export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 3; depth += 1) {
    if (typeof current === "object" && "code" in current && (current as { code?: unknown }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}
