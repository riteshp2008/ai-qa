import { describe, expect, it } from "vitest";

import { environmentInputSchema, reviewPipelineSchema, startPipelineSchema } from "./schemas";

describe("startPipelineSchema", () => {
  it("dedupes suites and requires at least one", () => {
    const parsed = startPipelineSchema.parse({ repositoryId: "6f1c1a52-0a43-4f7e-9d2f-1e0f6b9a1c11", suites: ["e2e", "e2e", "unit"] });
    expect(parsed.suites).toEqual(["e2e", "unit"]);
    expect(startPipelineSchema.safeParse({ repositoryId: "6f1c1a52-0a43-4f7e-9d2f-1e0f6b9a1c11", suites: [] }).success).toBe(false);
  });
});

describe("reviewPipelineSchema", () => {
  it("requires feedback when requesting changes", () => {
    expect(reviewPipelineSchema.safeParse({ decision: "request_changes" }).success).toBe(false);
    expect(reviewPipelineSchema.safeParse({ decision: "request_changes", feedback: "cover logout" }).success).toBe(true);
    expect(reviewPipelineSchema.safeParse({ decision: "approve" }).success).toBe(true);
  });
});

describe("environmentInputSchema", () => {
  it("parses KEY=value lines, skipping comments and blanks", () => {
    expect(environmentInputSchema.parse({ env: "# test creds\nDATABASE_URL=\"postgres://x\"\n\nPORT=3000" }).env)
      .toEqual({ DATABASE_URL: "postgres://x", PORT: "3000" });
  });

  it("rejects malformed lines", () => {
    expect(environmentInputSchema.safeParse({ env: "not a pair" }).success).toBe(false);
  });
});
