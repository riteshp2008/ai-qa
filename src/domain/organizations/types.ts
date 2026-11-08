import type { InviteRole, OrganizationRole } from "./roles";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

export type OrganizationMembership = {
  organization: Organization;
  role: OrganizationRole;
};

export type Member = {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: OrganizationRole;
  joinedAt: Date;
};

export type JoinRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type JoinRequest = {
  id: string;
  organizationId: string;
  userId: string;
  message: string | null;
  status: JoinRequestStatus;
  createdAt: Date;
  reviewedAt: Date | null;
};

/** A join request as reviewers see it, with the requester's identity. */
export type PendingJoinRequest = JoinRequest & {
  requester: { email: string; name: string | null };
};

/** A join request as the requester sees it, with the organization's identity. */
export type OutgoingJoinRequest = JoinRequest & {
  organization: { name: string; slug: string };
};

export type Invite = {
  id: string;
  email: string;
  role: InviteRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: Date;
  createdAt: Date;
};
