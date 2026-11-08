import "server-only";

import { unstable_rethrow } from "next/navigation";

import { AppError } from "@/domain/errors";
import type { ActionState } from "@/lib/forms/action-state";

/** FormData → plain object of string fields (files and Next's $ACTION_ keys are dropped). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}

/**
 * Runs a server action body and converts the outcome into ActionState.
 * Expected failures (AppError) become form errors; redirect()/notFound()
 * propagate; anything else is logged and shown as a generic error.
 */
export async function runAction(
  values: Record<string, string>,
  body: () => Promise<ActionState | void>,
): Promise<ActionState> {
  try {
    return (await body()) ?? { status: "success" };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AppError) {
      return { status: "error", message: error.message, fieldErrors: error.fieldErrors, values };
    }
    console.error("Server action failed.", error);
    return { status: "error", message: "Something went wrong on our side. Please try again.", values };
  }
}
