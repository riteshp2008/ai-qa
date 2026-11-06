import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id, role, teams(id, name, slug)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError || !membership) {
      throw new Error(membershipError?.message ?? "No workspace membership exists.");
    }

    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select("user_id, role, created_at")
      .eq("team_id", membership.team_id)
      .order("created_at", { ascending: true });

    const { data: invites, error: invitesError } = await supabase
      .from("team_invites")
      .select("id, email, role, status, expires_at, created_at")
      .eq("team_id", membership.team_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (membersError || invitesError) {
      throw new Error(membersError?.message ?? invitesError?.message ?? "Unable to load team data.");
    }

    return NextResponse.json({ team: membership.teams, role: membership.role, members, invites });
  } catch (error) {
    console.error("Team lookup failed.", error);
    return NextResponse.json({ message: "Unable to load workspace team." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown; role?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role === "admin" ? "admin" : "member";
  if (!email || !email.includes("@") || email.length > 320) {
    return NextResponse.json({ message: "Enter a valid collaborator email." }, { status: 400 });
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ message: "Only team owners and admins can invite collaborators." }, { status: 403 });
    }

    const { randomBytes, createHash } = await import("node:crypto");
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { error } = await supabase.from("team_invites").insert({
      team_id: membership.team_id,
      email,
      role,
      token_hash: tokenHash,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ inviteUrl: `/invite/${token}` }, { status: 201 });
  } catch (error) {
    console.error("Team invite creation failed.", error);
    return NextResponse.json({ message: "Unable to create collaborator invite." }, { status: 500 });
  }
}
