import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 place-items-center rounded-lg bg-brand text-white shadow-xs dark:text-[#04201d]", className)} aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-ink">Sentinel</span>
    </Link>
  );
}
