import { signOutAction } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { LogOutIcon } from "@/components/ui/icons";
import type { SessionUser } from "@/server/auth/session";

/** Compact identity + sign-out control. Uses a native <details> popover, no JS needed. */
export function UserMenu({ user, align = "right" }: { user: SessionUser; align?: "right" | "left-up" }) {
  const display = user.name ?? user.email;
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
        <Avatar name={display} />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-40 truncate text-[13px] font-medium text-ink">{user.name ?? "Account"}</span>
          <span className="block max-w-40 truncate text-xs text-muted">{user.email}</span>
        </span>
      </summary>
      <div
        className={
          align === "right"
            ? "absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-pop"
            : "absolute bottom-full left-0 z-30 mb-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-pop"
        }
      >
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium">{user.name ?? "Signed in"}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <div className="my-1 h-px bg-line" />
        <form action={signOutAction}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted transition hover:bg-surface-muted hover:text-ink">
            <LogOutIcon /> Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
