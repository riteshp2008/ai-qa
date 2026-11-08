import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { AppError } from "@/domain/errors";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

/** The signed-in user, verified with Supabase once per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const { user } = await getAuthenticatedUser();
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: (user.email ?? "").toLowerCase(),
    name: typeof metadata.full_name === "string" ? metadata.full_name : null,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
  };
});

/** For pages: returns the user or redirects to sign-in, preserving where they were going. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(returnTo ? `/sign-in?next=${encodeURIComponent(returnTo)}` : "/sign-in");
  }
  return user;
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function requireActionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("unauthenticated", "Your session has expired. Sign in again.");
  return user;
}
