"use client";

import { useState } from "react";

import { Button } from "./button";
import { CheckIcon, CopyIcon } from "./icons";

export function CopyButton({ value, label = "Copy", size = "sm" }: { value: string; label?: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="secondary" size={size} onClick={copy} aria-live="polite">
      {copied ? <CheckIcon className="text-brand" /> : <CopyIcon />}
      {copied ? "Copied" : label}
    </Button>
  );
}
