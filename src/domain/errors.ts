export type AppErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "unavailable";

export type FieldErrors = Record<string, string[] | undefined>;

/**
 * An expected, user-facing failure. Services throw these; the action and
 * route-handler adapters translate them into form state or HTTP responses.
 * Anything that is not an AppError is treated as an unexpected server error.
 */
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const httpStatusByCode: Record<AppErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation: 400,
  unavailable: 503,
};
