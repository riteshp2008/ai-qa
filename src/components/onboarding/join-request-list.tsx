import { cancelJoinRequestAction } from "@/app/onboarding/actions";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrgAvatar } from "@/components/ui/avatar";
import { SubmitButton } from "@/components/ui/submit-button";
import type { JoinRequestStatus, OutgoingJoinRequest } from "@/domain/organizations/types";
import { formatRelativeTime } from "@/lib/utils/format";

const statusDisplay: Record<JoinRequestStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: "warning", label: "Awaiting approval" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "danger", label: "Declined" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export function JoinRequestList({ requests, now }: { requests: OutgoingJoinRequest[]; now: Date }) {
  if (requests.length === 0) return null;
  return (
    <Card>
      <Card.Header title="Your join requests" description="Admins are notified by email. You'll get an email when they respond." />
      <ul className="divide-y divide-line">
        {requests.map((request) => {
          const display = statusDisplay[request.status];
          return (
            <li key={request.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <OrgAvatar name={request.organization.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{request.organization.name}</p>
                <p className="text-xs text-muted">
                  <span className="font-mono">{request.organization.slug}</span> · requested {formatRelativeTime(request.createdAt, now)}
                </p>
              </div>
              <Badge tone={display.tone} dot>{display.label}</Badge>
              {request.status === "pending" && (
                <form action={cancelJoinRequestAction.bind(null, request.id)}>
                  <SubmitButton variant="ghost" size="sm" pendingLabel="Cancelling…">Cancel</SubmitButton>
                </form>
              )}
              {request.status === "approved" && (
                <ButtonLink href={`/o/${request.organization.slug}`} size="sm">Open</ButtonLink>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
