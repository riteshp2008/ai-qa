import { isSafeTargetUrl } from "@/domain/test-runs/request";

export type CreateProjectRequest = {
  name: string;
  targetUrl: string;
};

export type ProjectRequestError = {
  field: string;
  message: string;
};

export function validateCreateProjectRequest(input: unknown): {
  value?: CreateProjectRequest;
  errors: ProjectRequestError[];
} {
  if (!input || typeof input !== "object") {
    return {
      errors: [{ field: "body", message: "Request body must be a JSON object." }],
    };
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl.trim() : "";
  const errors: ProjectRequestError[] = [];

  if (name.length < 1 || name.length > 100) {
    errors.push({ field: "name", message: "Project name must contain 1 to 100 characters." });
  }

  const urlError = isSafeTargetUrl(targetUrl);
  if (urlError) {
    errors.push({ field: "targetUrl", message: urlError });
  }

  return errors.length > 0
    ? { errors }
    : { value: { name, targetUrl }, errors: [] };
}
