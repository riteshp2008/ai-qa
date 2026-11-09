import { describe, expect, it } from "vitest";

import { artifactKindFor, checkReadable, checkWritable, isAllowedInPullRequest, normalizeRepoPath } from "./paths";

describe("normalizeRepoPath", () => {
  it("normalizes separators and leading ./", () => {
    expect(normalizeRepoPath("./tests\\unit//a.test.ts")).toEqual({ ok: true, path: "tests/unit/a.test.ts" });
  });

  it.each(["../etc/passwd", "a/../../b", "/etc/passwd", "C:/x", ""])("rejects %s", (raw) => {
    expect(normalizeRepoPath(raw).ok).toBe(false);
  });
});

describe("checkReadable", () => {
  it.each([".env", "apps/web/.env.local", ".git/config", "certs/server.pem", "node_modules/x/index.js"])("blocks %s", (path) => {
    expect(checkReadable(path).ok).toBe(false);
  });

  it("allows source files", () => {
    expect(checkReadable("src/app/page.tsx").ok).toBe(true);
  });
});

describe("checkWritable", () => {
  it("lets each agent write only its own area", () => {
    expect(checkWritable("e2e-tester", "e2e/login.spec.ts").ok).toBe(true);
    expect(checkWritable("e2e-tester", "src/app/page.tsx").ok).toBe(false);
    expect(checkWritable("containerizer", "Dockerfile").ok).toBe(true);
    expect(checkWritable("containerizer", "e2e/x.spec.ts").ok).toBe(false);
    expect(checkWritable("unit-tester", "src/lib/math.test.ts").ok).toBe(true);
    expect(checkWritable("unit-tester", "app/tests/test_models.py").ok).toBe(true);
    expect(checkWritable("unit-tester", "src/lib/math.ts").ok).toBe(false);
    expect(checkWritable("api-tester", "tests/api/users.spec.ts").ok).toBe(true);
  });

  it("never allows secrets even inside an allowed folder", () => {
    expect(checkWritable("e2e-tester", "e2e/.env").ok).toBe(false);
  });

  it("gives non-writing agents no write access", () => {
    expect(checkWritable("reviewer", "e2e/a.spec.ts").ok).toBe(false);
  });
});

describe("pull request allowlist", () => {
  it("accepts tests, docker files, and manifests but not app code", () => {
    expect(isAllowedInPullRequest("e2e/home.spec.ts")).toBe(true);
    expect(isAllowedInPullRequest("Dockerfile")).toBe(true);
    expect(isAllowedInPullRequest("package-lock.json")).toBe(true);
    expect(isAllowedInPullRequest("src/server.ts")).toBe(false);
    expect(isAllowedInPullRequest(".env")).toBe(false);
  });

  it("classifies artifacts", () => {
    expect(artifactKindFor("Dockerfile")).toBe("dockerfile");
    expect(artifactKindFor("e2e/a.spec.ts")).toBe("e2e");
    expect(artifactKindFor("tests/api/a.spec.ts")).toBe("api");
    expect(artifactKindFor("package.json")).toBe("dependency");
    expect(artifactKindFor("vitest.config.ts")).toBe("config");
    expect(artifactKindFor("src/a.test.ts")).toBe("unit");
  });
});
