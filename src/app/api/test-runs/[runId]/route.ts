import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("test_runs")
      .select("id, project_id, status, instruction, target_url, current_attempt, created_at, updated_at, started_at, completed_at, test_run_attempts(id, attempt_number, status, error_class, retry_reason, created_at, started_at, completed_at)")
      .eq("id", runId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load test run: ${error.message}`);
    }
    if (!data) {
      return NextResponse.json({ message: "Test run not found." }, { status: 404 });
    }

    return NextResponse.json({ run: data });
  } catch (error) {
    console.error("Test-run lookup failed.", error);
    return NextResponse.json({ message: "Unable to load the test run." }, { status: 500 });
  }
}
