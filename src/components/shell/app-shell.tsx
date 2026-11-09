import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import type { Organization, OrganizationMembership } from "@/domain/organizations/types";
import type { SessionUser } from "@/server/auth/session";
import { MobileNavigation } from "./mobile-navigation";
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

/** Desktop: persistent sidebar. Phones: top bar + bottom tabs + swipeable drawer. */
export function AppShell({ children, user, organization, memberships, pendingRequests }: AppShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#main" className="sr-only z-50 rounded-lg bg-surface px-3 py-2 shadow-pop focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col gap-5 border-r border-line bg-surface px-3 pb-3 pt-4 lg:flex">
        <Logo href={`/o/${organization.slug}`} className="px-1.5" />
        <OrgSwitcher current={organization} memberships={memberships} />
        <NavLinks orgSlug={organization.slug} pendingRequests={pendingRequests} layoutGroup="sidebar" />
        <div className="mt-auto border-t border-line pt-3">
          <UserMenu user={user} placement="top-stretch" />
        </div>
      </aside>

      <div className="min-w-0">
        <MobileNavigation user={user} organization={organization} memberships={memberships} pendingRequests={pendingRequests} />
        <main
          id="main"
          className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface lg:block" />
      <div>
        <div className="h-14 border-b border-line bg-surface lg:hidden" />
        <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="h-7 w-56 rounded-lg bg-surface-sunken" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-surface-sunken" />
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-surface-sunken" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
