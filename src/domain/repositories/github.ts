import { z } from "zod";

export type RepositoryReference = { owner: string; name: string };

const segment = /^[A-Za-z0-9_.-]{1,100}$/;

/**
 * Accepts `owner/name`, `https://github.com/owner/name(.git)`, or
 * `git@github.com:owner/name.git` and returns the owner/name pair.
 */
export function parseRepositoryReference(input: string): RepositoryReference | null {
  const value = input.trim();
  let path = value;

  const ssh = value.match(/^git@github\.com:(.+)$/i);
  if (ssh) {
    path = ssh[1];
  } else if (/^https?:\/\//i.test(value) || /^github\.com\//i.test(value)) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (url.hostname.toLowerCase() !== "github.com" && url.hostname.toLowerCase() !== "www.github.com") return null;
      path = url.pathname;
    } catch {
      return null;
    }
  }

  const [owner, rawName] = path.replace(/^\/+|\/+$/g, "").split("/");
  const name = rawName?.replace(/\.git$/i, "");
  if (!owner || !name || !segment.test(owner) || !segment.test(name)) return null;
  return { owner, name };
}

export const linkRepositorySchema = z.object({
  repository: z
    .string()
    .trim()
    .min(1, "Enter a GitHub repository.")
    .transform((value, ctx) => {
      const reference = parseRepositoryReference(value);
      if (!reference) {
        ctx.addIssue({ code: "custom", message: "Use owner/name or a github.com repository URL." });
        return z.NEVER;
      }
      return reference;
    }),
});

export type LinkedRepository = {
  id: string;
  projectId: string;
  provider: "github";
  fullName: string;
  defaultBranch: string;
  htmlUrl: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: Date;
};
