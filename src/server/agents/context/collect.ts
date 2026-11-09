import "server-only";

import type { SandboxSession } from "@/server/agents/sandbox";
import type { RepoSnapshot } from "./repo-snapshot";

const MANIFESTS = ["package.json", "pyproject.toml", "requirements.txt", "go.mod", "Gemfile", "composer.json", "docker-compose.yml", "compose.yaml", "Procfile", ".nvmrc", "tsconfig.json", "next.config.js", "next.config.ts", "vite.config.ts"];
const OPENAPI = /(^|\/)(openapi|swagger)\.(json|ya?ml)$/i;

async function readIfPresent(session: SandboxSession, path: string, maxChars: number) {
  if (!(await session.exists(path))) return null;
  const content = await session.readFile(path);
  return content.slice(0, maxChars);
}

/** Collects the raw repository facts from the cloned workspace (deterministic, no LLM). */
export async function collectRepoSnapshot(session: SandboxSession): Promise<RepoSnapshot> {
  const [listing, head, branch] = await Promise.all([
    session.run("git ls-files | head -5000"),
    session.run("git rev-parse HEAD"),
    session.run("git rev-parse --abbrev-ref HEAD"),
  ]);
  const files = listing.stdout.split("\n").map((line) => line.trim()).filter(Boolean);

  const manifests: Record<string, string> = {};
  await Promise.all(
    MANIFESTS.filter((name) => files.includes(name)).map(async (name) => {
      const content = await readIfPresent(session, name, 6000);
      if (content) manifests[name] = content;
    }),
  );

  const readmeName = files.find((file) => /^readme(\.md)?$/i.test(file));
  return {
    files,
    manifests,
    readme: readmeName ? await readIfPresent(session, readmeName, 4000) : null,
    dockerfile: files.includes("Dockerfile") ? await readIfPresent(session, "Dockerfile", 4000) : null,
    openApiPath: files.find((file) => OPENAPI.test(file)) ?? null,
    defaultBranch: branch.stdout.trim() || "main",
    headSha: head.stdout.trim(),
  };
}
