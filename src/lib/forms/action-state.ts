import type { FieldErrors } from "@/domain/errors";

/** Shape returned by every form server action, consumed by useActionState. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  /** Echoed values so forms keep user input after a failed submission. */
  values?: Record<string, string>;
  /** Extra payload for success states, e.g. a generated invite link. */
  data?: Record<string, string>;
};

export const idleState: ActionState = { status: "idle" };
