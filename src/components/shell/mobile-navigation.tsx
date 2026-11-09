"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Drawer } from "@/components/ui/drawer";
import { MenuIcon } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";
import { BottomTabBar } from "./bottom-tab-bar";
import type { MobileNavPanelProps } from "./mobile-nav-panel";
import { useOrgNavigation } from "./navigation";

const loadPanel = () => import("./mobile-nav-panel");

const MobileNavPanel = dynamic(loadPanel, {
  ssr: false,
  loading: () => (
    <div className="grid gap-3 p-4" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-surface-sunken" />)}
    </div>
  ),
});

/** Phone navigation: sticky top bar + bottom tab bar, both opening the same drawer. */
export function MobileNavigation(props: MobileNavPanelProps) {
  const { organization, user, pendingRequests } = props;
  const { current } = useOrgNavigation(organization.slug, pendingRequests);
  // Warm the lazy chunk on intent (hover/focus/touch) so opening feels instant.
  const prefetchPanel = useCallback(() => void loadPanel(), []);

  return (
    <Drawer>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/85 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-lg lg:hidden">
        <Drawer.Trigger
          className="grid size-10 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-ink active:scale-95"
          aria-label="Open navigation"
          onPointerEnter={prefetchPanel}
          onTouchStart={prefetchPanel}
          onFocus={prefetchPanel}
        >
          <MenuIcon className="size-5" />
        </Drawer.Trigger>
        <LogoMark className="size-7" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-semibold">{current?.label ?? "Sentinel"}</p>
          <p className="truncate text-[11px] text-muted">{organization.name}</p>
        </div>
        <Avatar name={user.name ?? user.email} size="sm" />
      </header>

      <BottomTabBar orgSlug={organization.slug} pendingRequests={pendingRequests} onPrefetchMore={prefetchPanel} />

      <Drawer.Content title="Navigation">
        <MobileNavPanel {...props} />
      </Drawer.Content>
    </Drawer>
  );
}
