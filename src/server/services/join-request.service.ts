import "server-only";

import { AppError } from "@/domain/errors";
import { isUuid } from "@/domain/ids";
import { joinRequestSchema } from "@/domain/organizations/schemas";
import type { JoinRequest, Organization, OutgoingJoinRequest, PendingJoinRequest } from "@/domain/organizations/types";
import { getDb } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/errors";
import { assertCan, type OrganizationContext } from "@/server/auth/organization-context";
import type { SessionUser } from "@/server/auth/session";
import { notifier } from "@/server/notifications/notifier";
import { joinRequestRepository } from "@/server/repositories/join-request.repository";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { profileRepository } from "@/server/repositories/profile.repository";
import { parseInput } from "./validation";

export type JoinDecision = "approve" | "reject";

async function findOrganizationByIdentifier(identifier: string): Promise<Organization | null> {
  return (await organizationRepository.findBySlug(identifier))
    ?? (isUuid(identifier) ? organizationRepository.findById(identifier) : null);
}

export const joinRequestService = {
  /**
   * Files a request to join an organization by its ID (slug or UUID) and
   * emails the organization's owners and admins. Repeating a request returns
   * the existing pending one instead of creating duplicates.
   */
  async request(user: SessionUser, input: unknown): Promise<{ request: JoinRequest; organization: Organization; created: boolean }> {
    const { organizationId, message } = parseInput(joinRequestSchema, input);
    const organization = await findOrganizationByIdentifier(organizationId);
    if (!organization) {
      throw new AppError("not_found", "No organization matches that ID.", {
        organizationId: ["We couldn't find that organization. Double-check the ID with an admin."],
      });
    }
    if (await organizationRepository.findMembership(user.id, organization.id)) {
      throw new AppError("conflict", `You're already a member of ${organization.name}.`);
    }

    const existing = await joinRequestRepository.findPending(organization.id, user.id);
    if (existing) return { request: existing, organization, created: false };

    let request: JoinRequest;
    try {
      request = await joinRequestRepository.insert({ organizationId: organization.id, userId: user.id, message });
    } catch (error) {
      const raced = isUniqueViolation(error) ? await joinRequestRepository.findPending(organization.id, user.id) : null;
      if (raced) return { request: raced, organization, created: false };
      throw error;
    }

    notifier.joinRequestCreated({ requestId: request.id, requester: { email: user.email, name: user.name } });
    return { request, organization, created: true };
  },

  listForUser(userId: string): Promise<OutgoingJoinRequest[]> {
    return joinRequestRepository.listForUser(userId);
  },

  listPending(context: OrganizationContext): Promise<PendingJoinRequest[]> {
    assertCan(context.role, "join-requests:review");
    return joinRequestRepository.listPendingForOrganization(context.organization.id);
  },

  countPending(context: OrganizationContext): Promise<number> {
    assertCan(context.role, "join-requests:review");
    return joinRequestRepository.countPendingForOrganization(context.organization.id);
  },

  async review(context: OrganizationContext, requestId: string, decision: JoinDecision): Promise<void> {
    assertCan(context.role, "join-requests:review");
    const request = isUuid(requestId) ? await joinRequestRepository.findById(requestId) : null;
    if (!request || request.organizationId !== context.organization.id) {
      throw new AppError("not_found", "That join request no longer exists.");
    }

    const resolved = await getDb().transaction(async (tx) => {
      const updated = await joinRequestRepository.resolve(request.id, decision === "approve" ? "approved" : "rejected", context.user.id, tx);
      if (updated && decision === "approve") {
        await organizationRepository.addMember({ organizationId: request.organizationId, userId: request.userId, role: "member" }, tx);
      }
      return updated;
    });
    if (!resolved) throw new AppError("conflict", "This request was already handled.");

    const requester = await profileRepository.findById(request.userId);
    if (requester?.email) {
      notifier.joinRequestDecided({
        requesterEmail: requester.email,
        organization: context.organization,
        approved: decision === "approve",
      });
    }
  },

  async cancel(user: SessionUser, requestId: string): Promise<void> {
    const request = isUuid(requestId) ? await joinRequestRepository.findById(requestId) : null;
    if (!request || request.userId !== user.id) throw new AppError("not_found", "That request no longer exists.");
    if (!(await joinRequestRepository.resolve(request.id, "cancelled", null))) {
      throw new AppError("conflict", "This request was already handled.");
    }
  },
};
