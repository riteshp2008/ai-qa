import { NextResponse } from "next/server";

import { AppError } from "@/domain/errors";
import { requireOrganizationAccess } from "@/server/auth/organization-context";
import { getSessionUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http/respond";
import { testRunService } from "@/server/services/test-run.service";

/** Starts a test run. Body: { projectId, url, instruction, idempotencyKey? } */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError("unauthenticated", "Authentication required.");

    const body: unknown = await request.json().catch(() => null);
    const { runId, created } = await testRunService.start(user, body);
    return NextResponse.json(
      { runId, status: "queued", statusUrl: `/api/test-runs/${runId}`, created },
      { status: created ? 202 : 200 },
    );
  } catch (error) {
    return errorResponse(error, "Unable to start the test run.");
  }
}

/** Lists recent runs for an organization: GET /api/test-runs?organization=<id>&projectId=<uuid> */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const slug = params.get("organization");
    if (!slug) throw new AppError("validation", "The organization query parameter is required.");

    const context = await requireOrganizationAccess(slug);
    const runs = await testRunService.listForOrganization(context, {
      projectId: params.get("projectId") ?? undefined,
      limit: Number(params.get("limit")) || 25,
    });
    return NextResponse.json({ runs });
  } catch (error) {
    return errorResponse(error, "Unable to load test runs.");
  }
}
