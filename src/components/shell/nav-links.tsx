"use client";

import { m } from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { useOrgNavigation } from "./navigation";

type NavLinksProps = {
  orgSlug: string;
  pendingRequests: number;
  /** Distinct per placement so the animated highlight doesn't jump between sidebar and drawer. */
  layoutGroup: string;
  onNavigate?: () => void;
};

export function NavLinks({ orgSlug, pendingRequests, layoutGroup, onNavigate }: NavLinksProps) {
  const { items } = useOrgNavigation(orgSlug, pendingRequests);

  return (
    <nav aria-label="Organization" className="grid gap-0.5">
      {items.map(({ href, label, icon: Icon, active, badge }) => (
        <Link
          key={href}
          href={href}
          prefetch
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
            active ? "text-ink" : "text-muted hover:bg-surface-muted hover:text-ink",
          )}
        >
          {active && <m.span layoutId={`${layoutGroup}-active`} className="absolute inset-0 rounded-lg bg-surface-sunken" aria-hidden="true" />}
          <Icon className={cn("relative size-4", active ? "text-brand" : "text-subtle group-hover:text-muted")} />
          <span className="relative">{label}</span>
          {badge && (
            <span className="relative ml-auto rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {badge}<span className="sr-only"> pending join requests</span>
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
