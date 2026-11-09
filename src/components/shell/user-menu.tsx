"use client";

import { signOutAction } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { LogOutIcon } from "@/components/ui/icons";
import { Menu } from "@/components/ui/menu";
import type { SessionUser } from "@/server/auth/session";

type Placement = "bottom-end" | "top-start" | "top-stretch";

export function UserMenu({ user, placement = "bottom-end" }: { user: SessionUser; placement?: Placement }) {
  const display = user.name ?? user.email;
  return (
    <Menu>
      <Menu.Trigger className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-surface-muted" aria-label="Account menu">
        <Avatar name={display} />
        <span className="hidden min-w-0 sm:block lg:block">
          <span className="block max-w-44 truncate text-[13px] font-medium text-ink">{user.name ?? "Account"}</span>
          <span className="block max-w-44 truncate text-xs text-muted">{user.email}</span>
        </span>
      </Menu.Trigger>
      <Menu.Content placement={placement}>
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium">{user.name ?? "Signed in"}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <Menu.Separator />
        <form action={signOutAction}>
          <Menu.Item type="submit"><LogOutIcon /> Sign out</Menu.Item>
        </form>
      </Menu.Content>
    </Menu>
  );
}
