import Link from "next/link";

import { OrgAvatar } from "@/components/ui/avatar";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "@/components/ui/icons";
import type { Organization, OrganizationMembership } from "@/domain/organizations/types";

export function OrgSwitcher({ current, memberships }: { current: Organization; memberships: OrganizationMembership[] }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg border border-line bg-surface p-2 shadow-xs transition hover:border-line-strong [&::-webkit-details-marker]:hidden">
        <OrgAvatar name={current.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">{current.name}</span>
          <span className="block truncate font-mono text-[11px] text-muted">{current.slug}</span>
        </span>
        <ChevronsUpDownIcon className="text-subtle" />
      </summary>
      <div className="absolute inset-x-0 top-full z-30 mt-1.5 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
        <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">Organizations</p>
        <ul className="max-h-64 overflow-y-auto">
          {memberships.map(({ organization }) => (
            <li key={organization.id}>
              <Link href={`/o/${organization.slug}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition hover:bg-surface-muted">
                <OrgAvatar name={organization.name} className="size-6 rounded-md text-[10px]" />
                <span className="min-w-0 flex-1 truncate">{organization.name}</span>
                {organization.id === current.id && <CheckIcon className="text-brand" />}
              </Link>
            </li>
          ))}
        </ul>
        <div className="my-1 h-px bg-line" />
        <Link href="/onboarding" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted transition hover:bg-surface-muted hover:text-ink">
          <PlusIcon /> Create or join organization
        </Link>
      </div>
    </details>
  );
}
