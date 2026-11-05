import { redirect } from "next/navigation";
import { connection } from "next/server";

import DashboardClient from "./dashboard-client";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const instant = false;

export default async function DashboardPage() {
  await connection();
  let user;
  try {
    ({ user } = await getAuthenticatedUser());
  } catch (error) {
    console.error("Dashboard authentication is unavailable.", error);
    redirect("/sign-in?error=configuration");
  }

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
