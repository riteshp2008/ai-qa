"use client";

import { useActionState, useState } from "react";

import { reviewPipelineAction } from "@/app/o/[orgSlug]/projects/[projectId]/pipelines/actions";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { AlertIcon, CheckIcon, GitHubIcon, XIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { formLevelState, idleState } from "@/lib/forms/action-state";

type ApprovalPanelProps = {
  orgSlug: string;
  pipelineId: string;
  canApprove: boolean;
  warnings: string[];
  fileCount: number;
};

/** Human-in-the-loop gate: nothing reaches the repository without an explicit approval here. */
export function ApprovalPanel({ orgSlug, pipelineId, canApprove, warnings, fileCount }: ApprovalPanelProps) {
  const [state, action] = useActionState(reviewPipelineAction.bind(null, orgSlug, pipelineId), idleState);
  const [mode, setMode] = useState<"decide" | "feedback">("decide");

  return (
    <Card className="border-amber-500/40 ring-4 ring-amber-500/10">
      <Card.Header
        title="Your review is needed"
        description={`${fileCount} file(s) are ready. Approve to open a pull request, send feedback to the agents, or reject.`}
      />
      <Card.Body className="grid gap-4 p-5">
        {warnings.length > 0 && (
          <ul className="grid gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-900 dark:text-amber-100">
            {warnings.map((warning) => <li key={warning} className="flex gap-2"><AlertIcon className="mt-0.5 shrink-0" />{warning}</li>)}
          </ul>
        )}
        {!canApprove ? (
          <p className="text-sm text-muted">Only organization owners and admins can approve pull requests.</p>
        ) : (
          <form action={action} className="grid gap-3">
            {mode === "feedback" && (
              <Field error={state.fieldErrors?.feedback}>
                <Field.Label>What should the agents change?</Field.Label>
                <Textarea name="feedback" rows={3} required autoFocus placeholder="Also cover the password-reset flow and assert the API returns 422 for invalid emails." />
              </Field>
            )}
            <FormAlert state={formLevelState(state)} />
            <div className="flex flex-wrap gap-2">
              {mode === "decide" ? (
                <>
                  <SubmitButton name="decision" value="approve" pendingLabel="Approving…"><GitHubIcon /> Approve &amp; open PR</SubmitButton>
                  <button type="button" onClick={() => setMode("feedback")} className="inline-flex h-9 items-center rounded-lg border border-line-strong bg-surface px-3.5 text-sm font-medium hover:bg-surface-muted">Request changes</button>
                  <SubmitButton name="decision" value="reject" variant="ghost" pendingLabel="Rejecting…"><XIcon /> Reject</SubmitButton>
                </>
              ) : (
                <>
                  <SubmitButton name="decision" value="request_changes" pendingLabel="Sending…"><CheckIcon /> Send to agents</SubmitButton>
                  <button type="button" onClick={() => setMode("decide")} className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm text-muted hover:bg-surface-muted">Back</button>
                </>
              )}
            </div>
          </form>
        )}
      </Card.Body>
    </Card>
  );
}
