"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "./button";
import { Spinner } from "./spinner";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & {
  pendingLabel?: ReactNode;
};

/** Submit button that disables itself and shows a spinner while its form's action runs. */
export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? <><Spinner />{pendingLabel ?? children}</> : children}
    </Button>
  );
}
