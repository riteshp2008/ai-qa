export type QualityIssue = { path: string; rule: string; message: string };

const assertionPattern = /\b(expect|assert|toHave|toBe|toEqual|toMatch|should\.|assertEquals|t\.(Error|Fatal|Fail))/;
const focusPattern = /\b(it|test|describe)\.only\s*\(|\bfit\s*\(|\bfdescribe\s*\(/;
const skipPattern = /\b(it|test|describe)\.(skip|todo)\s*\(|\bxit\s*\(|\bxdescribe\s*\(|@pytest\.mark\.skip|t\.Skip\(/;
const tautologyPattern = /expect\(\s*(true|1|['"][^'"]*['"])\s*\)\.(toBe|toEqual)\(\s*(true|1|['"][^'"]*['"])\s*\)|assert\s+True\b|expect\(\s*true\s*\)\.toBeTruthy\(\)/;
const sleepPattern = /waitForTimeout\(\s*\d{4,}|time\.sleep\(\s*\d{2,}/;

/**
 * Static checks that catch the classic ways an AI "makes tests pass":
 * no assertions, focused/skipped tests, tautologies, and long sleeps.
 */
export function inspectTestFile(path: string, content: string): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const isConfig = /config\.(ts|js|mjs|cjs)$|conftest\.py$|pytest\.ini$/.test(path);
  if (isConfig) return issues;

  if (!assertionPattern.test(content)) issues.push({ path, rule: "no-assertions", message: "Test file has no assertions." });
  if (focusPattern.test(content)) issues.push({ path, rule: "focused-test", message: "Remove .only / fit — it silently disables other tests." });
  if (skipPattern.test(content)) issues.push({ path, rule: "skipped-test", message: "Skipped or todo tests are not allowed; fix or delete them." });
  if (tautologyPattern.test(content)) issues.push({ path, rule: "tautology", message: "Assertion is always true and verifies nothing." });
  if (sleepPattern.test(content)) issues.push({ path, rule: "long-sleep", message: "Avoid fixed sleeps; wait for a condition instead." });
  return issues;
}
