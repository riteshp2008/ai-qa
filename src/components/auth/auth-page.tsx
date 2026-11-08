import { Suspense } from "react";

import { safeRedirectPath } from "@/lib/utils/redirect";
import { AuthForm } from "./auth-form";
import { AuthLayout } from "./auth-layout";

const errorMessages: Record<string, string> = {
  auth_callback: "That sign-in link is invalid or expired. Please try again.",
  configuration: "Authentication isn't configured on this server yet.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function AuthFormFromParams({ mode, searchParams }: { mode: "sign-in" | "sign-up"; searchParams: SearchParams }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? errorMessages[params.error] : undefined;
  return <AuthForm mode={mode} next={safeRedirectPath(params.next)} initialError={error} />;
}

/** Static shell renders instantly; only the query-string-dependent form streams. */
export function AuthPage({ mode, searchParams }: { mode: "sign-in" | "sign-up"; searchParams: SearchParams }) {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="h-[420px] animate-pulse rounded-xl bg-surface-muted" />}>
        <AuthFormFromParams mode={mode} searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
