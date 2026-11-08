import type { z } from "zod";

import { AppError, type FieldErrors } from "@/domain/errors";

/** Parses input with a schema, throwing a validation AppError with per-field messages. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length ? issue.path.join(".") : "form";
    (fieldErrors[field] ??= []).push(issue.message);
  }
  throw new AppError("validation", "Please fix the highlighted fields.", fieldErrors);
}
