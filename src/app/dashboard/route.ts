import { NextResponse, type NextRequest } from "next/server";

import { LAST_ORGANIZATION_COOKIE } from "@/lib/constants";
import { getSessionUser } from "@/server/auth/session";
import { organizationService } from "@/server/services/organization.service";

/**
 * Entry point after sign-in. Sends people to the organization they last used,
 * their first organization, or onboarding if they don't belong to one yet.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.redirect(new URL("/sign-in", request.url));

  const memberships = await organizationService.listForUser(user.id);
  if (memberships.length === 0) return NextResponse.redirect(new URL("/onboarding", request.url));

  const lastSlug = request.cookies.get(LAST_ORGANIZATION_COOKIE)?.value;
  const target = memberships.find((membership) => membership.organization.slug === lastSlug) ?? memberships[0];
  return NextResponse.redirect(new URL(`/o/${target.organization.slug}`, request.url));
}
