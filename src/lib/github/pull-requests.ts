import "server-only";

import { getRepositoryToken } from "./auth";
import { GitHubRequestError, githubRequest } from "./http";

export type FileChange = { path: string; content: string };

export type CreatedPullRequest = { number: number; url: string; branch: string };

type Ref = { object: { sha: string } };

/**
 * Commits `files` onto a new branch from `baseBranch` and opens a pull request,
 * using the Git Data API so no clone (and no write token in a sandbox) is needed.
 */
export async function openPullRequestWithFiles(input: {
  repositoryFullName: string;
  baseBranch: string;
  branch: string;
  title: string;
  body: string;
  commitMessage: string;
  files: FileChange[];
  draft: boolean;
}): Promise<CreatedPullRequest> {
  const token = await getRepositoryToken(input.repositoryFullName, "write");
  if (!token) throw new Error("GitHub write access is not configured (set GITHUB_APP_ID/GITHUB_APP_PRIVATE_KEY or GITHUB_TOKEN).");
  const repo = `/repos/${input.repositoryFullName}`;
  const request = <T>(path: string, method = "GET", body?: unknown) => githubRequest<T>(`${repo}${path}`, { token, method, body });

  const baseRef = await request<Ref>(`/git/ref/heads/${encodeURIComponent(input.baseBranch)}`);
  const baseCommit = await request<{ tree: { sha: string } }>(`/git/commits/${baseRef.object.sha}`);

  const tree = await Promise.all(
    input.files.map(async (file) => {
      const blob = await request<{ sha: string }>("/git/blobs", "POST", {
        content: Buffer.from(file.content, "utf8").toString("base64"),
        encoding: "base64",
      });
      return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );

  const newTree = await request<{ sha: string }>("/git/trees", "POST", { base_tree: baseCommit.tree.sha, tree });
  const commit = await request<{ sha: string }>("/git/commits", "POST", {
    message: input.commitMessage,
    tree: newTree.sha,
    parents: [baseRef.object.sha],
  });

  try {
    await request("/git/refs", "POST", { ref: `refs/heads/${input.branch}`, sha: commit.sha });
  } catch (error) {
    // Branch exists from a previous attempt: move it to the new commit.
    if (!(error instanceof GitHubRequestError && error.status === 422)) throw error;
    await request(`/git/refs/heads/${encodeURIComponent(input.branch)}`, "PATCH", { sha: commit.sha, force: true });
  }

  const owner = input.repositoryFullName.split("/")[0];
  const existing = await request<Array<{ number: number; html_url: string }>>(`/pulls?state=open&head=${encodeURIComponent(`${owner}:${input.branch}`)}`);
  if (existing[0]) return { number: existing[0].number, url: existing[0].html_url, branch: input.branch };

  const pull = await request<{ number: number; html_url: string }>("/pulls", "POST", {
    title: input.title,
    head: input.branch,
    base: input.baseBranch,
    body: input.body,
    draft: input.draft,
    maintainer_can_modify: true,
  });
  return { number: pull.number, url: pull.html_url, branch: input.branch };
}
