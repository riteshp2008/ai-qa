import "server-only";

import { createSign } from "node:crypto";

import { getGitHubToken } from "@/lib/config";
import { githubRequest } from "./http";

export type RepoAccess = "read" | "write";

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

/** Short-lived JWT identifying the GitHub App itself (RS256, 9 minutes). */
function createAppJwt(appId: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  return `${header}.${payload}.${signer.sign(privateKey).toString("base64url")}`;
}

function appCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return appId && privateKey ? { appId, privateKey } : null;
}

export function hasGitHubWriteAccessConfigured() {
  return Boolean(appCredentials() || getGitHubToken());
}

/**
 * A token for one repository with the least privilege needed.
 *
 * With a GitHub App (recommended) this mints an installation token scoped to
 * that single repository: read-only for cloning into the sandbox, and
 * contents + pull-requests write only on the server when opening the PR.
 * Without an App, falls back to GITHUB_TOKEN (a PAT) for local development.
 */
export async function getRepositoryToken(fullName: string, access: RepoAccess): Promise<string | undefined> {
  const credentials = appCredentials();
  if (!credentials) return getGitHubToken();

  const [owner, repo] = fullName.split("/");
  const jwt = createAppJwt(credentials.appId, credentials.privateKey);
  const installation = await githubRequest<{ id: number }>(`/repos/${owner}/${repo}/installation`, { bearerJwt: jwt });
  const permissions = access === "write" ? { contents: "write", pull_requests: "write" } : { contents: "read" };
  const { token } = await githubRequest<{ token: string }>(`/app/installations/${installation.id}/access_tokens`, {
    method: "POST",
    bearerJwt: jwt,
    body: { repositories: [repo], permissions },
  });
  return token;
}
