import "server-only";

export class GitHubRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "GitHubRequestError";
  }
}

/** Thin JSON client for the GitHub REST API with consistent headers, timeouts, and errors. */
export async function githubRequest<T>(
  path: string,
  options: { token?: string; method?: string; body?: unknown; bearerJwt?: string } = {},
): Promise<T> {
  const authorization = options.bearerJwt ?? options.token;
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sentinel-ai-qa",
      ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const message =
      response.status === 403 || response.status === 429
        ? "GitHub rate limit or permission error."
        : `GitHub ${options.method ?? "GET"} ${path} failed with ${response.status}.`;
    throw new GitHubRequestError(response.status, `${message} ${detail.slice(0, 300)}`.trim());
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
