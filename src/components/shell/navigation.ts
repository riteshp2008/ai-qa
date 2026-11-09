"use client";

import { usePathname } from "next/navigation";
import { useMemo, type ComponentType } from "react";

import { FolderIcon, HomeIcon, PlayIcon, SettingsIcon, UsersIcon, type IconProps } from "@/components/ui/icons";

type NavDefinition = {
  segment: "" | "/projects" | "/runs" | "/members" | "/settings";
  label: string;
  /** Short label for the mobile tab bar. */
  shortLabel: string;
  icon: ComponentType<IconProps>;
  /** Shown in the mobile bottom tab bar (the rest live in the drawer). */
  primary: boolean;
};

const definitions: readonly NavDefinition[] = [
  { segment: "", label: "Overview", shortLabel: "Home", icon: HomeIcon, primary: true },
  { segment: "/projects", label: "Projects", shortLabel: "Projects", icon: FolderIcon, primary: true },
  { segment: "/runs", label: "Test runs", shortLabel: "Runs", icon: PlayIcon, primary: true },
  { segment: "/members", label: "Members", shortLabel: "Team", icon: UsersIcon, primary: true },
  { segment: "/settings", label: "Settings", shortLabel: "Settings", icon: SettingsIcon, primary: false },
];

export type NavItem = NavDefinition & { href: string; active: boolean; badge?: number };

/** Single source of truth for organization navigation and which item is active. */
export function useOrgNavigation(orgSlug: string, pendingRequests: number) {
  const pathname = usePathname();
  return useMemo(() => {
    const base = `/o/${orgSlug}`;
    const items: NavItem[] = definitions.map((definition) => {
      const href = `${base}${definition.segment}`;
      return {
        ...definition,
        href,
        active: definition.segment === "" ? pathname === base : pathname === href || pathname.startsWith(`${href}/`),
        badge: definition.segment === "/members" && pendingRequests > 0 ? pendingRequests : undefined,
      };
    });
    return { items, current: items.find((item) => item.active) };
  }, [orgSlug, pathname, pendingRequests]);
}
