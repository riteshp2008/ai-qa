import { removeMemberAction } from "@/app/o/[orgSlug]/members/actions";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { outranks, type OrganizationRole } from "@/domain/organizations/roles";
import type { Member } from "@/domain/organizations/types";
import { formatDate } from "@/lib/utils/format";

export function MemberList({ members, orgSlug, currentUserId, viewerRole, canRemove }: {
  members: Member[];
  orgSlug: string;
  currentUserId: string;
  viewerRole: OrganizationRole;
  canRemove: boolean;
}) {
  return (
    <ul className="divide-y divide-line">
      {members.map((member) => {
        const display = member.name ?? member.email;
        const isYou = member.userId === currentUserId;
        const removable = canRemove && !isYou && outranks(viewerRole, member.role);
        return (
          <li key={member.userId} className="flex items-center gap-3 px-5 py-3.5">
            <Avatar name={display} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {display}
                {isYou && <span className="ml-1.5 text-xs font-normal text-subtle">(you)</span>}
              </p>
              <p className="truncate text-xs text-muted">{member.name ? `${member.email} · ` : ""}Joined {formatDate(member.joinedAt)}</p>
            </div>
            <RoleBadge role={member.role} />
            {removable && (
              <ActionButton
                action={removeMemberAction.bind(null, orgSlug, member.userId)}
                variant="ghost"
                confirm={`Remove ${display} from the organization?`}
                pendingLabel="Removing…"
              >
                Remove
              </ActionButton>
            )}
          </li>
        );
      })}
    </ul>
  );
}
