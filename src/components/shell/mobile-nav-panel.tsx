"use client";

import { Drawer, useDrawer } from "@/components/ui/drawer";
import { XIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import type { Organization, OrganizationMembership } from "@/domain/organizations/types";
import type { SessionUser } from "@/server/auth/session";
import { NavLinks } from "./nav-links";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

export type MobileNavPanelProps = {
  user: SessionUser;
  organization: Organization;
  memberships: OrganizationMembership[];
  pendingRequests: number;
};

/** Drawer body. Lazy-loaded on first open so phones that never open it don't pay for it. */
export default function MobileNavPanel({ user, organization, memberships, pendingRequests }: MobileNavPanelProps) {
  const { close } = useDrawer();
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-[max(env(safe-area-inset-top),12px)]">
      <div className="flex items-center justify-between px-1">
        <Logo href={`/o/${organization.slug}`} />
        <Drawer.Close className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-ink" aria-label="Close navigation">
          <XIcon className="size-5" />
        </Drawer.Close>
      </div>
      <OrgSwitcher current={organization} memberships={memberships} onNavigate={close} />
      <NavLinks orgSlug={organization.slug} pendingRequests={pendingRequests} layoutGroup="drawer" onNavigate={close} />
      <p className="mt-auto px-2 text-xs text-subtle">Swipe left or press Esc to close.</p>
      <div className="border-t border-line pt-3">
        <UserMenu user={user} placement="top-stretch" />
      </div>
    </div>
  );
}
