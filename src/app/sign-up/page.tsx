import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Sentinel account and start AI-planned, evidence-backed web testing.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return <AuthPage mode="sign-up" searchParams={searchParams} />;
}
