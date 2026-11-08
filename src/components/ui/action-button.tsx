"use client";

import { useActionState, type ReactNode } from "react";

import { idleState, type ActionState } from "@/lib/forms/action-state";
import type { ButtonSize, ButtonVariant } from "./button";
import { SubmitButton } from "./submit-button";

type ActionButtonProps = {
  action: () => Promise<ActionState>;
  children: ReactNode;
  pendingLabel?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** When set, the browser asks for confirmation before submitting. */
  confirm?: string;
  className?: string;
  "aria-label"?: string;
};

/** A single-button form for one-click mutations, with inline error feedback. */
export function ActionButton({ action, children, pendingLabel, variant = "secondary", size = "sm", confirm, className, ...rest }: ActionButtonProps) {
  const [state, formAction] = useActionState(async () => action(), idleState);
  return (
    <form
      action={formAction}
      className={className?.includes("w-full") ? "flex w-full flex-col gap-1" : "inline-flex flex-col items-end gap-1"}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      <SubmitButton variant={variant} size={size} pendingLabel={pendingLabel} className={className} aria-label={rest["aria-label"]}>
        {children}
      </SubmitButton>
      {state.status === "error" && <span role="alert" className="max-w-56 text-right text-xs text-danger">{state.message}</span>}
    </form>
  );
}
