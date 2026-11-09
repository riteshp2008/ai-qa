import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getServerEnv, hasSupabaseAuthConfig } from "@/lib/config";
import { LAST_ORGANIZATION_COOKIE } from "@/lib/constants";
import { safeRedirectPath } from "@/lib/utils/redirect";

const protectedPrefixes = ["/dashboard", "/onboarding", "/o/"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix));
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabaseAuthConfig()) {
    return response;
  }

  const supabase = createServerClient(
    getServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const redirectTo = (target: URL) => {
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && isProtectedPath(pathname)) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", `${pathname}${search}`);
    return redirectTo(signIn);
  }

  if (user && pathname === "/") {
    return redirectTo(new URL("/dashboard", request.url));
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return redirectTo(new URL(safeRedirectPath(request.nextUrl.searchParams.get("next")), request.url));
  }

  const orgSlug = user ? pathname.match(/^\/o\/([^/]+)/)?.[1] : undefined;
  if (orgSlug && request.cookies.get(LAST_ORGANIZATION_COOKIE)?.value !== orgSlug) {
    response.cookies.set(LAST_ORGANIZATION_COOKIE, orgSlug, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 365 });
  }

  return response;
}
