import "server-only";

import { CommandExitError, Sandbox, TimeoutError } from "e2b";

import { getServerEnv } from "@/lib/config";
import type { CommandOutcome, RunOptions, SandboxProvider, SandboxSession } from "./types";

const REPO_DIR = "/home/user/repo";
const DEFAULT_COMMAND_TIMEOUT_MS = 5 * 60_000;
const SANDBOX_LIFETIME_MS = 60 * 60_000;

function templateName() {
  // Built from scripts/e2b/build-template.ts: Ubuntu + Docker + Node + Python + Playwright browsers.
  return process.env.E2B_TEMPLATE || "sentinel-docker";
}

class E2BSession implements SandboxSession {
  readonly repoDir = REPO_DIR;

  constructor(private readonly sandbox: Sandbox) {}

  get id() {
    return this.sandbox.sandboxId;
  }

  async run(command: string, options: RunOptions = {}): Promise<CommandOutcome> {
    try {
      const result = await this.sandbox.commands.run(command, {
        cwd: options.cwd ?? REPO_DIR,
        timeoutMs: options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS,
        envs: { CI: "1", ...options.envs },
      });
      return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr, timedOut: false };
    } catch (error) {
      // E2B throws on non-zero exit; agents need the output, not an exception.
      if (error instanceof CommandExitError) {
        return { exitCode: error.exitCode, stdout: error.stdout, stderr: error.stderr, timedOut: false };
      }
      if (error instanceof TimeoutError) {
        return { exitCode: 124, stdout: "", stderr: `Command timed out after ${options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS}ms.`, timedOut: true };
      }
      throw error;
    }
  }

  async readFile(path: string) {
    return this.sandbox.files.read(this.absolute(path));
  }

  async writeFile(path: string, content: string) {
    await this.sandbox.files.write(this.absolute(path), content);
  }

  async exists(path: string) {
    return this.sandbox.files.exists(this.absolute(path));
  }

  async extend(ms: number) {
    await this.sandbox.setTimeout(ms);
  }

  async kill() {
    await this.sandbox.kill();
  }

  private absolute(path: string) {
    return path.startsWith("/") ? path : `${REPO_DIR}/${path}`;
  }
}

export const e2bProvider: SandboxProvider = {
  name: "e2b",

  async create({ metadata }) {
    const sandbox = await Sandbox.create(templateName(), {
      apiKey: getServerEnv("E2B_API_KEY"),
      timeoutMs: SANDBOX_LIFETIME_MS,
      metadata,
    });
    return new E2BSession(sandbox);
  },

  async connect(id) {
    const sandbox = await Sandbox.connect(id, { apiKey: getServerEnv("E2B_API_KEY"), timeoutMs: SANDBOX_LIFETIME_MS });
    return new E2BSession(sandbox);
  },

  async kill(id) {
    await Sandbox.kill(id, { apiKey: getServerEnv("E2B_API_KEY") });
  },
};
