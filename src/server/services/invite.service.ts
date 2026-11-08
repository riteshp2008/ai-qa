import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { AppError } from "@/domain/errors";
import { inviteSchema } from "@/domain/organizations/schemas";
import type { Invite, Organization } from "@/domain/organizations/types";
import { getAppUrl } from "@/lib/config";
import { getDb } from "@/lib/db/client";
import { assertCan, type OrganizationContext } from "@/server/auth/organization-context";
import type { SessionUser } from "@/server/auth/session";
import { notifier } from "@/server/notifications/notifier";
import { inviteRepository, type InviteRecord } from "@/server/repositories/invite.repository";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { parseInput } from "./validation";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type InvitePreview =
  | { state: "valid"; organization: Organization; email: string }
  | { state: "invalid" };

function isUsable(invite: InviteRecord | null): invite is InviteRecord {
  return Boolean(invite && invite.status === "pending" && invite.expiresAt > new Date());
}

export const inviteService = {
  /** Creates a single-use, 7-day invite link and emails it to the invitee. */
  async create(context: OrganizationContext, input: unknown): Promise<{ invite: Invite; inviteUrl: string }> {
    assertCan(context.role, "invites:manage");
    const { email, role } = parseInput(inviteSchema, input);
    if (await inviteRepository.findPendingByEmail(context.organization.id, email)) {
      throw new AppError("conflict", "An invite is already pending for that email.", { email: ["Already invited — revoke the old invite to send a new one."] });
    }

    const token = randomBytes(32).toString("base64url");
    const invite = await inviteRepository.insert({
      organizationId: context.organization.id,
      email,
      role,
      tokenHash: hashToken(token),
      invitedBy: context.user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });
    const inviteUrl = `${getAppUrl()}/invite/${token}`;
    notifier.inviteCreated({ email, organizationName: context.organization.name, inviterEmail: context.user.email, inviteUrl });
    return { invite, inviteUrl };
  },

  listPending(context: OrganizationContext): Promise<Invite[]> {
    assertCan(context.role, "invites:manage");
    return inviteRepository.listPending(context.organization.id);
  },

  async revoke(context: OrganizationContext, inviteId: string): Promise<void> {
    assertCan(context.role, "invites:manage");
    if (!(await inviteRepository.revoke(context.organization.id, inviteId))) {
      throw new AppError("not_found", "That invite is no longer pending.");
    }
  },

  async preview(token: string): Promise<InvitePreview> {
    const invite = await inviteRepository.findByTokenHash(hashToken(token));
    if (!isUsable(invite)) return { state: "invalid" };
    const organization = await organizationRepository.findById(invite.organizationId);
    return organization ? { state: "valid", organization, email: invite.email } : { state: "invalid" };
  },

  async accept(user: SessionUser, token: string): Promise<Organization> {
    const invite = await inviteRepository.findByTokenHash(hashToken(token));
    if (!isUsable(invite)) throw new AppError("not_found", "This invitation is invalid or has expired.");
    if (invite.email !== user.email) {
      throw new AppError("forbidden", `This invitation was sent to ${invite.email}. Sign in with that email to accept it.`);
    }

    const accepted = await getDb().transaction(async (tx) => {
      const marked = await inviteRepository.markAccepted(invite.id, tx);
      if (marked) {
        await organizationRepository.addMember({ organizationId: invite.organizationId, userId: user.id, role: invite.role }, tx);
      }
      return marked;
    });
    if (!accepted) throw new AppError("conflict", "This invitation was already used.");

    const organization = await organizationRepository.findById(invite.organizationId);
    if (!organization) throw new AppError("not_found", "The organization no longer exists.");
    return organization;
  },
};
