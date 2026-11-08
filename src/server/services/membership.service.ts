import "server-only";

import { AppError } from "@/domain/errors";
import { outranks } from "@/domain/organizations/roles";
import type { Member } from "@/domain/organizations/types";
import { assertCan, type OrganizationContext } from "@/server/auth/organization-context";
import { organizationRepository } from "@/server/repositories/organization.repository";

export const membershipService = {
  listMembers(context: OrganizationContext): Promise<Member[]> {
    return organizationRepository.listMembers(context.organization.id);
  },

  /** Owners can remove admins and members; admins can remove members. */
  async removeMember(context: OrganizationContext, userId: string): Promise<void> {
    assertCan(context.role, "members:remove");
    if (userId === context.user.id) {
      throw new AppError("validation", "Use “Leave organization” in settings to remove yourself.");
    }
    const targetRole = await organizationRepository.findMembership(userId, context.organization.id);
    if (!targetRole) throw new AppError("not_found", "That person is no longer a member.");
    if (!outranks(context.role, targetRole)) {
      throw new AppError("forbidden", "You can only remove members with a lower role than yours.");
    }
    await organizationRepository.removeMember(context.organization.id, userId);
  },

  async leave(context: OrganizationContext): Promise<void> {
    if (context.role === "owner" && (await organizationRepository.countOwners(context.organization.id)) <= 1) {
      throw new AppError("conflict", "You're the only owner. Promote another owner before leaving.");
    }
    await organizationRepository.removeMember(context.organization.id, context.user.id);
  },
};
