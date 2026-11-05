import { NextResponse } from "next/server";

import { getMissingServiceVariables, hasExternalServicesConfigured } from "@/lib/config";
import {
  hashTestRunRequest,
  validateTestRunRequest,
} from "@/domain/test-runs/request";
import { isTargetWithinProjectScope } from "@/domain/projects/target-scope";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const validation = validateTestRunRequest(body);
  if (!validation.value) {
    return NextResponse.json({ message: "Invalid test-run request.", errors: validation.errors }, { status: 400 });
  }

  if (!validation.value.projectId) {
    return NextResponse.json({ message: "A project is required to start a test run." }, { status: 400 });
  }

  let projectTargetUrl: string;
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from("projects")
      .select("target_url")
      .eq("id", validation.value.projectId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to verify project ownership: ${error.message}`);
    }
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    projectTargetUrl = project.target_url;
  } catch (error) {
    console.error("Test-run authorization failed.", error);
    return NextResponse.json({ message: "Unable to authorize the test run." }, { status: 500 });
  }

  if (!isTargetWithinProjectScope(projectTargetUrl, validation.value.url)) {
    return NextResponse.json({ message: "Target URL is outside the project's authorized scope." }, { status: 403 });
  }

  if (!hasExternalServicesConfigured()) {
    return NextResponse.json({
      message: "The real test runner is not configured yet.",
      missing: getMissingServiceVariables(),
    }, { status: 503 });
  }

  return NextResponse.json({
    message: "Run intake is authorized, but durable persistence and dispatch are not wired yet.",
    requestHash: hashTestRunRequest(validation.value),
    missingCapabilities: ["Supabase run persistence", "Inngest event dispatch"],
  }, { status: 501 });
}
