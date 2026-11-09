"use client";

import { m } from "framer-motion";
import Link from "next/link";

import { Drawer } from "@/components/ui/drawer";
import { MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { useOrgNavigation } from "./navigation";

const tabClasses = "relative flex flex-1 flex-col items-center justify-center gap-1 pb-1 pt-2 text-[11px] font-medium transition-colors";

/** Thumb-reachable primary navigation for phones; secondary items live in the drawer ("More"). */
export function BottomTabBar({ orgSlug, pendingRequests, onPrefetchMore }: { orgSlug: string; pendingRequests: number; onPrefetchMore: () => void }) {
  const { items } = useOrgNavigation(orgSlug, pendingRequests);
  const primary = items.filter((item) => item.primary);
  const moreActive = items.some((item) => !item.primary && item.active);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        {primary.map(({ href, shortLabel, icon: Icon, active, badge }) => (
          <m.div key={href} className="flex flex-1" whileTap={{ scale: 0.92 }}>
            <Link href={href} prefetch aria-current={active ? "page" : undefined} className={cn(tabClasses, active ? "text-brand-ink" : "text-muted")}>
              {active && <m.span layoutId="tabbar-active" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand" aria-hidden="true" />}
              <span className="relative">
                <Icon className="size-5" />
                {badge && <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold leading-4 text-white">{badge}</span>}
              </span>
              {shortLabel}
            </Link>
          </m.div>
        ))}
        <m.div className="flex flex-1" whileTap={{ scale: 0.92 }}>
          <Drawer.Trigger
            className={cn(tabClasses, moreActive ? "text-brand-ink" : "text-muted")}
            onPointerEnter={onPrefetchMore}
            onFocus={onPrefetchMore}
            aria-label="More navigation"
          >
            {moreActive && <m.span layoutId="tabbar-active" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand" aria-hidden="true" />}
            <MenuIcon className="size-5" />
            More
          </Drawer.Trigger>
        </m.div>
      </div>
    </nav>
  );
}
