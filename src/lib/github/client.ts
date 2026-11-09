import "server-only";

import { getRepositoryToken } from "./auth";
import { GitHubRequestError, githubRequest } from "./http";

export { GitHubRequestError };

export type GitHubRepository = {
  id: number;
  full_name: string;
  html_url: string;
  default_branch: string;
  description: string | null;
  private: boolean;
};

/** Fetches repository metadata. Returns null when it does not exist or is not visible to us. */
export async function fetchGitHubRepository(owner: string, name: string): Promise<GitHubRepository | null> {
  const token = await getRepositoryToken(`${owner}/${name}`, "read").catch(() => undefined);
  try {
    return await githubRequest<GitHubRepository>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, { token });
  } catch (error) {
    if (error instanceof GitHubRequestError && error.status === 404) return null;
    throw error;
  }
}
