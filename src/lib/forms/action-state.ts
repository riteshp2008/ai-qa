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
  /** Unique per server response; lets forms react to every new result, even identical ones. */
  nonce?: string;
};

export const idleState: ActionState = { status: "idle" };

/** Form-level alert state: hidden when per-field errors already explain the problem. */
export function formLevelState(state: ActionState): ActionState {
  return state.fieldErrors ? idleState : state;
}

/**
 * A React key that changes after each successful submission. Keying fields on
 * it resets uncontrolled inputs without syncing state in effects.
 */
export function resetKey(state: ActionState) {
  return state.status === "success" ? `success:${state.nonce ?? state.message ?? ""}` : "form";
}
