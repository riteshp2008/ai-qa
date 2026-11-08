import { revokeInviteAction } from "@/app/o/[orgSlug]/members/actions";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { MailIcon } from "@/components/ui/icons";
import type { Invite } from "@/domain/organizations/types";
import { formatRelativeTime } from "@/lib/utils/format";

export function InviteList({ invites, orgSlug, now }: { invites: Invite[]; orgSlug: string; now: Date }) {
  if (invites.length === 0) return null;
  return (
    <div className="border-t border-line">
      <p className="px-5 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-subtle">Pending invitations</p>
      <ul className="divide-y divide-line">
        {invites.map((invite) => {
          const expired = invite.expiresAt <= now;
          return (
            <li key={invite.id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid size-8 place-items-center rounded-full bg-surface-sunken text-subtle"><MailIcon /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{invite.email}</p>
                <p className="text-xs text-muted">{expired ? "Expired" : `Expires ${formatRelativeTime(invite.expiresAt, now)}`} · {invite.role}</p>
              </div>
              {expired ? <Badge>Expired</Badge> : <Badge tone="info">Invited</Badge>}
              <ActionButton action={revokeInviteAction.bind(null, orgSlug, invite.id)} variant="ghost" pendingLabel="Revoking…">Revoke</ActionButton>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
