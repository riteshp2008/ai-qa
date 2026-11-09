"use client";

import { createContext, use, useId, useMemo, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type FieldContextValue = {
  controlId: string;
  hintId: string;
  errorId: string;
  error?: string;
};

const FieldContext = createContext<FieldContextValue | null>(null);

/** Props a control inside a <Field> should receive for labels and screen readers. */
function useFieldControlProps(explicitId?: string) {
  const field = use(FieldContext);
  if (!field) return { id: explicitId };
  return {
    id: explicitId ?? field.controlId,
    "aria-invalid": field.error ? true : undefined,
    "aria-describedby": field.error ? field.errorId : field.hintId,
  } as const;
}

/**
 * Compound form field:
 *
 *   <Field error={errors?.email}>
 *     <Field.Label>Email</Field.Label>
 *     <Input name="email" />
 *     <Field.Hint>We never share it.</Field.Hint>
 *     <Field.Error />
 *   </Field>
 *
 * The root generates ids and shares them through context, so label, control,
 * hint, and error are wired together without passing ids around.
 */
function Field({ id, error, className, children }: { id?: string; error?: string[]; className?: string; children: ReactNode }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const message = error?.[0];
  const value = useMemo<FieldContextValue>(
    () => ({ controlId, hintId: `${controlId}-hint`, errorId: `${controlId}-error`, error: message }),
    [controlId, message],
  );
  return (
    <FieldContext value={value}>
      <div className={cn("grid gap-1.5", className)}>{children}</div>
    </FieldContext>
  );
}

function FieldLabel({ children, optional, className }: { children: ReactNode; optional?: boolean; className?: string }) {
  const field = use(FieldContext);
  return (
    <label htmlFor={field?.controlId} className={cn("flex items-baseline justify-between text-[13px] font-medium text-ink", className)}>
      {children}
      {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
    </label>
  );
}

/** Helper text; hidden while the field shows an error. */
function FieldHint({ children }: { children: ReactNode }) {
  const field = use(FieldContext);
  if (field?.error) return null;
  return <p id={field?.hintId} className="text-[13px] text-muted">{children}</p>;
}

function FieldError() {
  const field = use(FieldContext);
  if (!field?.error) return null;
  return <p id={field.errorId} role="alert" className="text-[13px] text-danger">{field.error}</p>;
}

Field.Label = FieldLabel;
Field.Hint = FieldHint;
Field.Error = FieldError;

export { Field };

export function Input({ className, id, ...props }: ComponentProps<"input">) {
  return <input {...useFieldControlProps(id)} className={cn("control h-9", className)} {...props} />;
}

export function Textarea({ className, id, ...props }: ComponentProps<"textarea">) {
  return <textarea {...useFieldControlProps(id)} className={cn("control min-h-24 resize-y leading-relaxed", className)} {...props} />;
}

export function Select({ className, id, ...props }: ComponentProps<"select">) {
  return <select {...useFieldControlProps(id)} className={cn("control h-9 pr-8", className)} {...props} />;
}
