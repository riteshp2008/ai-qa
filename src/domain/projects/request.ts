import { z } from "zod";

import { isSafeTargetUrl } from "@/domain/test-runs/request";

const targetUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter the application URL.")
  .superRefine((value, ctx) => {
    const error = isSafeTargetUrl(value);
    if (error) ctx.addIssue({ code: "custom", message: error });
  });

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Give the project a name.").max(100, "Project names are limited to 100 characters."),
  targetUrl: targetUrlSchema,
});

export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
