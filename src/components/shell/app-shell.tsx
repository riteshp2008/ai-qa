import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import type { Organization, OrganizationMembership } from "@/domain/organizations/types";
import type { SessionUser } from "@/server/auth/session";
import { MobileDrawer } from "./mobile-drawer";
import { NavLinks } from "./nav-links";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

type AppShellProps = {
  user: SessionUser;
  organization: Organization;
  memberships: OrganizationMembership[];
  pendingRequests: number;
  children: ReactNode;
};

function SidebarContent({ user, organization, memberships, pendingRequests }: Omit<AppShellProps, "children">) {
  return (
    <div className="flex h-full flex-col gap-5">
      <OrgSwitcher current={organization} memberships={memberships} />
      <NavLinks orgSlug={organization.slug} pendingRequests={pendingRequests} />
      <div className="mt-auto border-t border-line pt-3">
        <UserMenu user={user} align="left-up" />
      </div>
    </div>
  );
}

export function AppShell({ children, ...props }: AppShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 pb-3 pt-4 lg:flex">
        <Logo href={`/o/${props.organization.slug}`} className="mb-5 px-1.5" />
        <SidebarContent {...props} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur lg:hidden">
          <MobileDrawer>
            <SidebarContent {...props} />
          </MobileDrawer>
          <Logo href={`/o/${props.organization.slug}`} />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface lg:block" />
      <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-10 sm:px-6 lg:px-10">
        <div className="h-7 w-56 rounded-lg bg-surface-sunken" />
        <div className="mt-3 h-4 w-80 rounded bg-surface-sunken" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-surface-sunken" />)}
        </div>
      </div>
    </div>
  );
}
