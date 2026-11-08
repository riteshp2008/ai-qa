export const organizationRoles = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof organizationRoles)[number];

export type InviteRole = Exclude<OrganizationRole, "owner">;

/**
 * Every privileged action in the app maps to exactly one permission.
 * Changing who can do what happens here and nowhere else.
 */
const permissionMatrix = {
  "organization:update": ["owner", "admin"],
  "members:remove": ["owner", "admin"],
  "join-requests:review": ["owner", "admin"],
  "invites:manage": ["owner", "admin"],
  "projects:create": ["owner", "admin", "member"],
  "projects:delete": ["owner", "admin"],
  "repositories:link": ["owner", "admin", "member"],
  "repositories:unlink": ["owner", "admin"],
  "runs:create": ["owner", "admin", "member"],
} as const satisfies Record<string, readonly OrganizationRole[]>;

export type Permission = keyof typeof permissionMatrix;

export function can(role: OrganizationRole, permission: Permission) {
  return (permissionMatrix[permission] as readonly OrganizationRole[]).includes(role);
}

export function roleLabel(role: OrganizationRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/** Owners outrank admins, who outrank members. */
export function outranks(actor: OrganizationRole, target: OrganizationRole) {
  return organizationRoles.indexOf(actor) < organizationRoles.indexOf(target);
}
