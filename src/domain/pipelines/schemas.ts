import { z } from "zod";

import { suiteKinds } from "./types";

export const startPipelineSchema = z.object({
  repositoryId: z.uuid("Choose a linked repository."),
  suites: z.array(z.enum(suiteKinds)).min(1, "Pick at least one kind of test.").transform((list) => Array.from(new Set(list))),
  instructions: z
    .string()
    .trim()
    .max(4000, "Keep instructions under 4,000 characters.")
    .optional()
    .transform((value) => value || undefined),
});
export type StartPipelineInput = z.infer<typeof startPipelineSchema>;

export const reviewPipelineSchema = z.object({
  decision: z.enum(["approve", "request_changes", "reject"]),
  feedback: z.string().trim().max(4000).optional().transform((value) => value || undefined),
}).refine((value) => value.decision !== "request_changes" || Boolean(value.feedback), {
  message: "Tell the agents what to change.",
  path: ["feedback"],
});
export type ReviewPipelineInput = z.infer<typeof reviewPipelineSchema>;

/** KEY=value lines provided by a human when the app needs configuration to boot. */
export const environmentInputSchema = z.object({
  env: z
    .string()
    .max(8000)
    .transform((raw, ctx) => {
      const entries: Record<string, string> = {};
      for (const [index, line] of raw.split(/\r?\n/).entries()) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) {
          ctx.addIssue({ code: "custom", message: `Line ${index + 1} must look like KEY=value.` });
          return z.NEVER;
        }
        entries[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
      return entries;
    }),
});
