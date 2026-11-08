import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background,color,box-shadow,border-color] duration-150 disabled:pointer-events-none disabled:opacity-55 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-xs hover:bg-brand-hover dark:text-[#04201d]",
  secondary: "border border-line-strong bg-surface text-ink shadow-xs hover:bg-surface-muted hover:border-subtle",
  ghost: "text-muted hover:bg-surface-muted hover:text-ink",
  danger: "border border-line-strong bg-surface text-danger hover:bg-danger-soft hover:border-danger/40",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export function buttonClasses({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
