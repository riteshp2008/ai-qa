import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Sentinel to manage your organization, projects, and AI test runs.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return <AuthPage mode="sign-in" searchParams={searchParams} />;
}
