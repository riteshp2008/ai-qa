"use client";

import { OrgAvatar } from "@/components/ui/avatar";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "@/components/ui/icons";
import { Menu } from "@/components/ui/menu";
import type { Organization, OrganizationMembership } from "@/domain/organizations/types";

export function OrgSwitcher({ current, memberships, onNavigate }: { current: Organization; memberships: OrganizationMembership[]; onNavigate?: () => void }) {
  return (
    <Menu>
      <Menu.Trigger
        className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface p-2 text-left shadow-xs transition hover:border-line-strong"
        aria-label={`Switch organization (current: ${current.name})`}
      >
        <OrgAvatar name={current.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">{current.name}</span>
          <span className="block truncate font-mono text-[11px] text-muted">{current.slug}</span>
        </span>
        <ChevronsUpDownIcon className="text-subtle" />
      </Menu.Trigger>
      <Menu.Content placement="bottom-stretch">
        <Menu.Label>Organizations</Menu.Label>
        <div className="max-h-64 overflow-y-auto">
          {memberships.map(({ organization }) => (
            <Menu.Item key={organization.id} href={`/o/${organization.slug}`} onClick={onNavigate} aria-current={organization.id === current.id ? "true" : undefined}>
              <OrgAvatar name={organization.name} className="size-6 rounded-md text-[10px]" />
              <span className="min-w-0 flex-1 truncate text-ink">{organization.name}</span>
              {organization.id === current.id && <CheckIcon className="text-brand" />}
            </Menu.Item>
          ))}
        </div>
        <Menu.Separator />
        <Menu.Item href="/onboarding" onClick={onNavigate}>
          <PlusIcon /> Create or join organization
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}
