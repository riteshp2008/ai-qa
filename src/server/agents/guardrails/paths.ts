import type { AgentName, ArtifactKind } from "@/domain/pipelines/types";
import { matchesAny } from "./glob";

/** Never writable or readable by agents, regardless of role. */
const forbidden = [
  ".git/**",
  "**/.env",
  "**/.env.*",
  "**/*.pem",
  "**/*.key",
  "**/id_rsa*",
  "**/.npmrc",
  "**/.pypirc",
  "**/node_modules/**",
] as const;

/**
 * Files each agent may create or modify. Application source is deliberately
 * absent: agents write tests and container config, never product code.
 */
export const writePolicy: Partial<Record<AgentName, readonly string[]>> = {
  containerizer: ["Dockerfile", ".dockerignore", "docker/sentinel/**"],
  "e2e-tester": ["e2e/**", "tests/e2e/**", "playwright.config.{ts,js,mjs}"],
  "api-tester": ["tests/api/**", "api-tests/**", "playwright.api.config.{ts,js,mjs}"],
  "unit-tester": [
    "**/*.test.{ts,tsx,js,jsx,mjs,cjs}",
    "**/*.spec.{ts,tsx,js,jsx,mjs,cjs}",
    "**/__tests__/**",
    "tests/unit/**",
    "**/test_*.py",
    "**/*_test.py",
    "**/*_test.go",
    "vitest.config.{ts,js,mjs}",
    "jest.config.{ts,js,mjs,cjs}",
    "pytest.ini",
    "conftest.py",
  ],
};

/** Paths allowed to appear in the final pull request (agents' files plus dependency manifests). */
const pullRequestAllowlist = [
  ...Object.values(writePolicy).flat(),
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "requirements-dev.txt",
  "requirements.txt",
  "pyproject.toml",
  "poetry.lock",
  "go.mod",
  "go.sum",
];

export type PathCheck = { ok: true; path: string } | { ok: false; reason: string };

/** Normalizes a repo-relative path and rejects traversal, absolute paths, and NUL bytes. */
export function normalizeRepoPath(raw: string): PathCheck {
  if (!raw || raw.includes("\0")) return { ok: false, reason: "Path is empty or contains a NUL byte." };
  const cleaned = raw.trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (cleaned.startsWith("/") || /^[a-zA-Z]:/.test(cleaned)) return { ok: false, reason: "Use a path relative to the repository root." };
  const segments: string[] = [];
  for (const segment of cleaned.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") return { ok: false, reason: "Path traversal (..) is not allowed." };
    segments.push(segment);
  }
  if (segments.length === 0) return { ok: false, reason: "Path points at the repository root." };
  return { ok: true, path: segments.join("/") };
}

export function checkReadable(raw: string): PathCheck {
  const normalized = normalizeRepoPath(raw);
  if (!normalized.ok) return normalized;
  if (matchesAny(normalized.path, forbidden)) return { ok: false, reason: `Reading ${normalized.path} is not allowed (secrets/VCS internals).` };
  return normalized;
}

export function checkWritable(agent: AgentName, raw: string): PathCheck {
  const normalized = checkReadable(raw);
  if (!normalized.ok) return normalized;
  const allowed = writePolicy[agent] ?? [];
  if (!matchesAny(normalized.path, allowed)) {
    return { ok: false, reason: `${agent} may only write: ${allowed.join(", ") || "nothing"}. Application source must not be modified.` };
  }
  return normalized;
}

export function isAllowedInPullRequest(path: string) {
  return !matchesAny(path, forbidden) && matchesAny(path, pullRequestAllowlist);
}

export function artifactKindFor(path: string): ArtifactKind {
  if (matchesAny(path, writePolicy.containerizer ?? [])) return "dockerfile";
  if (matchesAny(path, ["e2e/**", "tests/e2e/**"])) return "e2e";
  if (matchesAny(path, ["tests/api/**", "api-tests/**"])) return "api";
  if (/(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|requirements(-dev)?\.txt|pyproject\.toml|poetry\.lock|go\.(mod|sum))$/.test(path)) return "dependency";
  if (/config\.(ts|js|mjs|cjs)$|pytest\.ini$|conftest\.py$/.test(path)) return "config";
  return "unit";
}
