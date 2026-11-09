#!/usr/bin/env node
/**
 * Builds the E2B sandbox template the agent pipeline runs in.
 *
 *   E2B_API_KEY=... node scripts/e2b/build-template.mjs [template-name]
 *
 * Contents: Ubuntu 24.04, Docker Engine (so agents can build and run the
 * repository's Dockerfile), Node.js 22, Python 3 + pytest, git, and
 * Playwright's Chromium with its system dependencies preinstalled so test
 * agents never download browsers mid-run.
 */
import { defaultBuildLogger, Template } from "e2b";

const name = process.argv[2] ?? process.env.E2B_TEMPLATE ?? "sentinel-docker";

if (!process.env.E2B_API_KEY) {
  console.error("E2B_API_KEY is required.");
  process.exit(1);
}

const template = Template()
  .fromUbuntuImage("24.04")
  .aptInstall(["ca-certificates", "curl", "git", "jq", "unzip", "build-essential", "python3", "python3-pip", "python3-venv", "sudo"])
  // Docker Engine (documented E2B approach for Docker-in-sandbox).
  .runCmd("curl -fsSL https://get.docker.com | sh", { user: "root" })
  .runCmd("usermod -aG docker user || true", { user: "root" })
  // Node.js 22 LTS + package managers.
  .runCmd("curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs", { user: "root" })
  .runCmd("npm install -g pnpm yarn", { user: "root" })
  .runCmd("pip3 install --break-system-packages pytest pytest-cov requests", { user: "root" })
  // Shared Playwright browsers so `npx playwright test` works in any repo without downloading.
  .setEnvs({ PLAYWRIGHT_BROWSERS_PATH: "/ms-playwright", CI: "1" })
  .runCmd("npx -y playwright@latest install --with-deps chromium && chmod -R a+rx /ms-playwright", { user: "root" })
  .runCmd("docker --version && node --version && python3 --version", { user: "root" });

const info = await Template.build(template, name, {
  cpuCount: 4,
  memoryMB: 4096,
  onBuildLogs: defaultBuildLogger(),
});

console.log(`\nBuilt E2B template "${name}".`, info);
console.log(`Set E2B_TEMPLATE=${name} (the default) in your environment.`);
