import type { ActionState } from "@/lib/forms/action-state";
import { cn } from "@/lib/utils/cn";
import { AlertIcon, CheckIcon } from "./icons";

/** Form-level feedback for an ActionState. Renders nothing while idle. */
export function FormAlert({ state, className }: { state: ActionState; className?: string }) {
  if (state.status === "idle" || !state.message) return null;
  const isError = state.status === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed",
        isError ? "border-danger/30 bg-danger-soft text-danger" : "border-brand/25 bg-brand-soft text-brand-ink",
        className,
      )}
    >
      {isError ? <AlertIcon className="mt-0.5" /> : <CheckIcon className="mt-0.5" />}
      <span>{state.message}</span>
    </div>
  );
}
