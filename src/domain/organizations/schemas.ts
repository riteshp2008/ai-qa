import { z } from "zod";

export const ORGANIZATION_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;

const reservedSlugs = new Set(["new", "settings", "admin", "api", "onboarding", "dashboard", "invite"]);

export const organizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(ORGANIZATION_SLUG_PATTERN, "Use 3–48 lowercase letters, numbers, or hyphens.")
  .refine((slug) => !reservedSlugs.has(slug), "That organization ID is reserved.");

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be 80 characters or fewer."),
  slug: organizationSlugSchema,
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const renameOrganizationSchema = createOrganizationSchema.pick({ name: true });

export const joinRequestSchema = z.object({
  organizationId: z.string().trim().toLowerCase().min(1, "Enter an organization ID.").max(64),
  message: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters.")
    .optional()
    .transform((value) => value || undefined),
});
export type JoinRequestInput = z.infer<typeof joinRequestSchema>;

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().max(320).pipe(z.email("Enter a valid email address.")),
  role: z.enum(["admin", "member"]).default("member"),
});
export type InviteInput = z.infer<typeof inviteSchema>;

/** Turns "Acme Corp, Inc." into "acme-corp-inc". */
export function slugifyOrganizationName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}
