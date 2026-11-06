import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { getAuthenticatedUser, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const { user } = await getAuthenticatedUser();
    if (!user?.email) {
      return NextResponse.json({ message: "Sign in with the invited email before accepting." }, { status: 401 });
    }

    const serviceRole = createSupabaseServiceRoleClient();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: invite, error } = await serviceRole
      .from("team_invites")
      .select("id, team_id, email, role, status, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !invite || invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ message: "This collaborator invite is invalid or expired." }, { status: 400 });
    }
    if (invite.email !== user.email.toLowerCase()) {
      return NextResponse.json({ message: "This invite was issued to a different email address." }, { status: 403 });
    }

    const { error: memberError } = await serviceRole.from("team_members").upsert({
      team_id: invite.team_id,
      user_id: user.id,
      role: invite.role,
    });
    if (memberError) {
      throw new Error(memberError.message);
    }

    const { error: inviteError } = await serviceRole
      .from("team_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id)
      .eq("status", "pending");
    if (inviteError) {
      throw new Error(inviteError.message);
    }

    return NextResponse.json({ message: "You joined the workspace team.", teamId: invite.team_id });
  } catch (error) {
    console.error("Team invite acceptance failed.", error);
    return NextResponse.json({ message: "Unable to accept collaborator invite." }, { status: 500 });
  }
}
