import { reviewJoinRequestAction } from "@/app/o/[orgSlug]/members/actions";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import type { PendingJoinRequest } from "@/domain/organizations/types";
import { formatRelativeTime } from "@/lib/utils/format";

export function JoinRequestQueue({ requests, orgSlug, now }: { requests: PendingJoinRequest[]; orgSlug: string; now: Date }) {
  if (requests.length === 0) return null;
  return (
    <Card className="border-amber-500/30 ring-1 ring-amber-500/10">
      <CardHeader
        title={<span className="flex items-center gap-2">Join requests <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{requests.length}</span></span>}
        description="People who asked to join with your organization ID. Approved requesters join as members."
      />
      <ul className="divide-y divide-line">
        {requests.map((request) => {
          const display = request.requester.name ?? request.requester.email;
          return (
            <li key={request.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar name={display} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{display}</p>
                  <p className="truncate text-xs text-muted">{request.requester.name ? `${request.requester.email} · ` : ""}{formatRelativeTime(request.createdAt, now)}</p>
                  {request.message && <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-[13px] text-muted">“{request.message}”</p>}
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <ActionButton action={reviewJoinRequestAction.bind(null, orgSlug, request.id, "reject")} variant="ghost" pendingLabel="Declining…">Decline</ActionButton>
                <ActionButton action={reviewJoinRequestAction.bind(null, orgSlug, request.id, "approve")} variant="primary" pendingLabel="Approving…"><CheckIcon /> Approve</ActionButton>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
