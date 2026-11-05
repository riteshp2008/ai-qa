import { NextResponse } from "next/server";

import { getMissingServiceVariables, hasExternalServicesConfigured } from "@/lib/config";
import {
  hashTestRunRequest,
  validateTestRunRequest,
} from "@/domain/test-runs/request";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const validation = validateTestRunRequest(body);
  if (!validation.value) {
    return NextResponse.json({ message: "Invalid test-run request.", errors: validation.errors }, { status: 400 });
  }

  if (!hasExternalServicesConfigured()) {
    return NextResponse.json({
      message: "The real test runner is not configured yet.",
      missing: getMissingServiceVariables(),
    }, { status: 503 });
  }

  return NextResponse.json({
    message: "Run intake is validated, but authentication, durable persistence, and dispatch are not wired yet.",
    requestHash: hashTestRunRequest(validation.value),
    missingCapabilities: ["authenticated project ownership", "Supabase run persistence", "Inngest event dispatch"],
  }, { status: 501 });
}
