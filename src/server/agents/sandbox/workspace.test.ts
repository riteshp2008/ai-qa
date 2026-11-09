import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { parseTestCounts } = await import("./workspace");

describe("parseTestCounts", () => {
  it("reads Playwright summaries", () => {
    expect(parseTestCounts("  12 passed (8.1s)\n  2 failed")).toEqual({ passed: 12, failed: 2 });
  });

  it("reads Vitest summaries", () => {
    expect(parseTestCounts(" Test Files  3 passed (3)\n      Tests  1 failed | 41 passed (42)")).toEqual({ passed: 41, failed: 1 });
  });

  it("reads pytest summaries", () => {
    expect(parseTestCounts("===== 5 passed, 1 failed in 0.12s =====")).toEqual({ passed: 5, failed: 1 });
  });

  it("reads go test output", () => {
    expect(parseTestCounts("--- PASS: TestA\n--- PASS: TestB\n--- FAIL: TestC")).toEqual({ passed: 2, failed: 1 });
  });
});
