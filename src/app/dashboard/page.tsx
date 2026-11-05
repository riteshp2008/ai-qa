import { redirect } from "next/navigation";

import DashboardClient from "./dashboard-client";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const instant = false;

export default async function DashboardPage() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <DashboardClient
      user={{
        email: user.email ?? "Workspace member",
        name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined,
      }}
    />
  );
}
