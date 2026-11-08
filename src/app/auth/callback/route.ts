import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectPath = safeRedirectPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=auth_callback", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Authentication callback failed.", error);
    return NextResponse.redirect(new URL("/sign-in?error=auth_callback", url.origin));
  }

  return NextResponse.redirect(new URL(redirectPath, url.origin));
}
