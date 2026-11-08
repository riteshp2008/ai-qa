import "server-only";

import { AppError } from "@/domain/errors";
import { createOrganizationSchema, renameOrganizationSchema } from "@/domain/organizations/schemas";
import type { Organization, OrganizationMembership } from "@/domain/organizations/types";
import { getDb } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/errors";
import { assertCan, type OrganizationContext } from "@/server/auth/organization-context";
import type { SessionUser } from "@/server/auth/session";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { parseInput } from "./validation";

const slugTaken = () =>
  new AppError("conflict", "That organization ID is taken.", { slug: ["That organization ID is already in use. Try another."] });

export const organizationService = {
  listForUser(userId: string): Promise<OrganizationMembership[]> {
    return organizationRepository.listMembershipsForUser(userId);
  },

  /** Creates the organization and makes the creator its owner, atomically. */
  async create(user: SessionUser, input: unknown): Promise<Organization> {
    const { name, slug } = parseInput(createOrganizationSchema, input);
    if (await organizationRepository.slugExists(slug)) throw slugTaken();

    try {
      return await getDb().transaction(async (tx) => {
        const organization = await organizationRepository.insert({ name, slug, createdBy: user.id }, tx);
        await organizationRepository.addMember({ organizationId: organization.id, userId: user.id, role: "owner" }, tx);
        return organization;
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw slugTaken();
      throw error;
    }
  },

  async rename(context: OrganizationContext, input: unknown): Promise<void> {
    assertCan(context.role, "organization:update");
    const { name } = parseInput(renameOrganizationSchema, input);
    await organizationRepository.updateName(context.organization.id, name);
  },
};
