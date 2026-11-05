import { NextResponse } from "next/server";

import { getMissingServiceVariables, getServiceConfig } from "@/lib/config";

export function GET() {
  const missing = getMissingServiceVariables();
  return NextResponse.json({
    status: missing.length === 0 ? "ready" : "configuration_required",
    services: getServiceConfig(),
    missing,
  }, { status: missing.length === 0 ? 200 : 503 });
}
