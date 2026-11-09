"use client";

import { useCallback } from "react";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "./button";
import { CheckIcon, CopyIcon } from "./icons";

export function CopyButton({ value, label = "Copy", size = "sm" }: { value: string; label?: string; size?: "sm" | "md" }) {
  const { copied, copy } = useCopyToClipboard();
  const onClick = useCallback(() => void copy(value), [copy, value]);

  return (
    <Button variant="secondary" size={size} onClick={onClick}>
      {copied ? <CheckIcon className="text-brand" /> : <CopyIcon />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </Button>
  );
}
