"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderIcon, HomeIcon, PlayIcon, SettingsIcon, UsersIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const items = [
  { segment: "", label: "Overview", icon: HomeIcon },
  { segment: "/projects", label: "Projects", icon: FolderIcon },
  { segment: "/runs", label: "Test runs", icon: PlayIcon },
  { segment: "/members", label: "Members", icon: UsersIcon },
  { segment: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function NavLinks({ orgSlug, pendingRequests, onNavigate }: { orgSlug: string; pendingRequests: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const base = `/o/${orgSlug}`;

  return (
    <nav aria-label="Organization" className="grid gap-0.5">
      {items.map(({ segment, label, icon: Icon }) => {
        const href = `${base}${segment}`;
        const active = segment === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition",
              active ? "bg-surface-sunken text-ink" : "text-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            <Icon className={cn("size-4", active ? "text-brand" : "text-subtle group-hover:text-muted")} />
            {label}
            {segment === "/members" && pendingRequests > 0 && (
              <span className="ml-auto rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300" aria-label={`${pendingRequests} pending join requests`}>
                {pendingRequests}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
