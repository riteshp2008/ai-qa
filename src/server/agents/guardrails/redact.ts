const patterns: Array<[RegExp, string]> = [
  [/gh[pousr]_[A-Za-z0-9]{20,}/g, "[REDACTED_GITHUB_TOKEN]"],
  [/github_pat_[A-Za-z0-9_]{20,}/g, "[REDACTED_GITHUB_TOKEN]"],
  [/x-access-token:[^@\s]+@/g, "x-access-token:[REDACTED]@"],
  [/sk-[A-Za-z0-9_-]{20,}/g, "[REDACTED_API_KEY]"],
  [/AIza[0-9A-Za-z_-]{30,}/g, "[REDACTED_API_KEY]"],
  [/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_KEY]"],
  [/e2b_[A-Za-z0-9]{20,}/g, "[REDACTED_API_KEY]"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[REDACTED_JWT]"],
  [/((?:password|passwd|secret|token|api[_-]?key)\s*[=:]\s*)["']?[^\s"']{6,}/gi, "$1[REDACTED]"],
];

/**
 * Removes credentials from text before it is logged, stored, or sent to a model.
 * `extraSecrets` covers values we know at runtime (e.g. human-provided env vars).
 */
export function redactSecrets(text: string, extraSecrets: readonly string[] = []): string {
  let result = text;
  for (const secret of extraSecrets) {
    if (secret.length >= 4) result = result.split(secret).join("[REDACTED]");
  }
  for (const [pattern, replacement] of patterns) result = result.replace(pattern, replacement);
  return result;
}

/** True when text appears to contain a credential (used to block artifacts from reaching a PR). */
export function containsSecret(text: string) {
  return redactSecrets(text) !== text;
}
