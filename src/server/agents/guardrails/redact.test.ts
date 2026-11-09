import { describe, expect, it } from "vitest";

import { containsSecret, redactSecrets } from "./redact";

describe("redactSecrets", () => {
  it("removes common credential formats", () => {
    const text = "token ghp_abcdefghijklmnopqrstuvwxyz0123 key AIzaSyA1234567890abcdefghijklmnopqrstu password=hunter22";
    const redacted = redactSecrets(text);
    expect(redacted).not.toContain("ghp_");
    expect(redacted).not.toContain("AIza");
    expect(redacted).not.toContain("hunter22");
  });

  it("removes runtime-provided secrets", () => {
    expect(redactSecrets("db at postgres://u:s3cretpw@h", ["s3cretpw"])).toBe("db at postgres://u:[REDACTED]@h");
  });

  it("detects secrets", () => {
    expect(containsSecret("const x = 1")).toBe(false);
    // Assembled at runtime so no real-looking key header is committed (the pre-commit secret guard would block it).
    const label = ["RSA", "PRIVATE", "KEY"].join(" ");
    expect(containsSecret(`-----BEGIN ${label}-----\nabc\n-----END ${label}-----`)).toBe(true);
  });
});
