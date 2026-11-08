import "server-only";

import { getGitHubToken } from "@/lib/config";

export type GitHubRepository = {
  id: number;
  full_name: string;
  html_url: string;
  default_branch: string;
  description: string | null;
  private: boolean;
};

export class GitHubRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "GitHubRequestError";
  }
}

/** Fetches repository metadata. Returns null when it does not exist or is not visible to the token. */
export async function fetchGitHubRepository(owner: string, name: string): Promise<GitHubRepository | null> {
  const token = getGitHubToken();
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sentinel-ai-qa",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(8000),
  });

  if (response.status === 404) return null;
  if (response.status === 403 || response.status === 429) {
    throw new GitHubRequestError(response.status, "GitHub rate limit reached. Try again shortly or configure GITHUB_TOKEN.");
  }
  if (!response.ok) {
    throw new GitHubRequestError(response.status, `GitHub responded with status ${response.status}.`);
  }
  return (await response.json()) as GitHubRepository;
}
