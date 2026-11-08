import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type FieldProps = {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string[];
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error, with ids wired for screen readers. */
export function Field({ label, htmlFor, hint, error, optional, className, children }: FieldProps) {
  const message = error?.[0];
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[13px] font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
      </label>
      {children}
      {message ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-danger">{message}</p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type ControlExtras = { invalid?: boolean };

function describedBy(id: string | undefined, invalid?: boolean) {
  return id ? (invalid ? `${id}-error` : `${id}-hint`) : undefined;
}

export function Input({ className, invalid, id, ...props }: ComponentProps<"input"> & ControlExtras) {
  return <input id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy(id, invalid)} className={cn("control h-9", className)} {...props} />;
}

export function Textarea({ className, invalid, id, ...props }: ComponentProps<"textarea"> & ControlExtras) {
  return <textarea id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy(id, invalid)} className={cn("control min-h-24 resize-y leading-relaxed", className)} {...props} />;
}

export function Select({ className, invalid, id, ...props }: ComponentProps<"select"> & ControlExtras) {
  return <select id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy(id, invalid)} className={cn("control h-9 pr-8", className)} {...props} />;
}
