import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { AppError } from "@/domain/errors";
import { can, type OrganizationRole, type Permission } from "@/domain/organizations/roles";
import type { Organization } from "@/domain/organizations/types";
import { organizationRepository } from "@/server/repositories/organization.repository";
import { getSessionUser, requireUser, type SessionUser } from "./session";

/** Everything an organization-scoped operation needs to authorize itself. */
export type OrganizationContext = {
  user: SessionUser;
  organization: Organization;
  role: OrganizationRole;
};

const loadContext = cache(async (userId: string, slug: string) => {
  const organization = await organizationRepository.findBySlug(slug);
  if (!organization) return null;
  const role = await organizationRepository.findMembership(userId, organization.id);
  return role ? { organization, role } : null;
});

/**
 * For pages and layouts under /o/[orgSlug]. Non-members get a 404 so
 * organization IDs cannot be probed through the UI.
 */
export async function requireOrganizationPage(slug: string): Promise<OrganizationContext> {
  const user = await requireUser(`/o/${slug}`);
  const context = await loadContext(user.id, slug);
  if (!context) notFound();
  return { user, ...context };
}

/** For server actions and route handlers: throws AppErrors instead of rendering. */
export async function requireOrganizationAccess(slug: string, permission?: Permission): Promise<OrganizationContext> {
  const user = await getSessionUser();
  if (!user) throw new AppError("unauthenticated", "Your session has expired. Sign in again.");
  const context = await loadContext(user.id, slug);
  if (!context) throw new AppError("not_found", "Organization not found.");
  if (permission) assertCan(context.role, permission);
  return { user, ...context };
}

export function assertCan(role: OrganizationRole, permission: Permission) {
  if (!can(role, permission)) {
    throw new AppError("forbidden", "You don't have permission to do that in this organization.");
  }
}
