import "server-only";

import { e2bProvider } from "./e2b-provider";
import type { SandboxProvider } from "./types";

/**
 * Sandbox backends are pluggable. E2B (Firecracker microVMs with Docker
 * inside) is the default; add a provider here to support another one.
 */
const providers: Record<string, SandboxProvider> = { e2b: e2bProvider };

export function getSandboxProvider(): SandboxProvider {
  const name = process.env.SANDBOX_PROVIDER ?? "e2b";
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown SANDBOX_PROVIDER "${name}". Available: ${Object.keys(providers).join(", ")}.`);
  return provider;
}

export type { CommandOutcome, SandboxProvider, SandboxSession } from "./types";
