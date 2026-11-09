import { describe, expect, it } from "vitest";

import { inspectTestFile } from "./test-quality";

const rules = (content: string) => inspectTestFile("e2e/a.spec.ts", content).map((issue) => issue.rule);

describe("inspectTestFile", () => {
  it("accepts a meaningful test", () => {
    expect(rules(`test("home", async ({ page }) => { await page.goto("/"); await expect(page).toHaveTitle(/App/); });`)).toEqual([]);
  });

  it("flags tests that cannot fail or never run", () => {
    expect(rules(`test("x", () => {});`)).toContain("no-assertions");
    expect(rules(`test.only("x", () => { expect(a).toBe(1) });`)).toContain("focused-test");
    expect(rules(`test.skip("x", () => { expect(a).toBe(1) });`)).toContain("skipped-test");
    expect(rules(`test("x", () => { expect(true).toBe(true) });`)).toContain("tautology");
    expect(rules(`test("x", async ({ page }) => { await page.waitForTimeout(5000); expect(a).toBe(1) });`)).toContain("long-sleep");
  });

  it("ignores config files", () => {
    expect(inspectTestFile("playwright.config.ts", "export default {}")).toEqual([]);
  });
});
