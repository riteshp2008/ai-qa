import { createHash } from "node:crypto";

export type TestRunRequest = {
  projectId?: string;
  url: string;
  instruction: string;
  idempotencyKey: string;
};

export type TestRunRequestError = {
  field: string;
  message: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized === "localhost.localdomain" ||
    normalized === "metadata.google.internal" ||
    normalized.endsWith(".local") ||
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized) ||
    normalized === "0.0.0.0" ||
    normalized === "::1"
  );
}

export function isSafeTargetUrl(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") {
      return "Target URL must use HTTPS.";
    }
    if (isPrivateHostname(parsedUrl.hostname)) {
      return "Private, local, and metadata hosts are not allowed.";
    }
    if (parsedUrl.username || parsedUrl.password) {
      return "Target URLs cannot contain credentials.";
    }
  } catch {
    return "Target URL must be a valid HTTPS URL.";
  }

  return undefined;
}

export function validateTestRunRequest(input: unknown): {
  value?: TestRunRequest;
  errors: TestRunRequestError[];
} {
  const errors: TestRunRequestError[] = [];
  if (!input || typeof input !== "object") {
    return { errors: [{ field: "body", message: "Request body must be a JSON object." }] };
  }

  const body = input as Record<string, unknown>;
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : crypto.randomUUID();
  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : undefined;

  const urlError = isSafeTargetUrl(url);
  if (urlError) {
    errors.push({ field: "url", message: urlError });
  }

  if (instruction.length < 10 || instruction.length > 10_000) {
    errors.push({ field: "instruction", message: "Instruction must contain 10 to 10,000 characters." });
  }
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    errors.push({ field: "idempotencyKey", message: "Idempotency key must contain 8 to 200 characters." });
  }
  if (projectId && !uuidPattern.test(projectId)) {
    errors.push({ field: "projectId", message: "Project ID must be a UUID." });
  }

  return errors.length > 0
    ? { errors }
    : { value: { projectId, url, instruction, idempotencyKey }, errors: [] };
}

export function hashTestRunRequest(request: TestRunRequest) {
  const canonical = JSON.stringify({
    projectId: request.projectId ?? null,
    url: request.url,
    instruction: request.instruction,
  });
  return createHash("sha256").update(canonical).digest("hex");
}
