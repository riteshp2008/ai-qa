"use client";

import { useActionState } from "react";

import { provideEnvironmentAction } from "@/app/o/[orgSlug]/projects/[projectId]/pipelines/actions";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { LockIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { formLevelState, idleState } from "@/lib/forms/action-state";

/** HITL: the containerizer couldn't boot the app without configuration only a human can provide. */
export function EnvironmentPanel({ orgSlug, pipelineId, missingEnv }: { orgSlug: string; pipelineId: string; missingEnv: string[] }) {
  const [state, action] = useActionState(provideEnvironmentAction.bind(null, orgSlug, pipelineId), idleState);
  return (
    <Card className="border-amber-500/40 ring-4 ring-amber-500/10">
      <Card.Header title="The app needs configuration to start" description="Provide values for a disposable test environment. Never paste production secrets." />
      <Card.Body className="p-5">
        <form action={action} className="grid gap-3">
          <Field error={state.fieldErrors?.env}>
            <Field.Label>Environment (KEY=value per line)</Field.Label>
            <Textarea
              name="env"
              rows={Math.min(8, Math.max(3, missingEnv.length + 1))}
              required
              spellCheck={false}
              autoComplete="off"
              className="font-mono text-xs"
              defaultValue={missingEnv.map((name) => `${name}=`).join("\n")}
            />
            <Field.Hint>
              <span className="inline-flex items-center gap-1"><LockIcon className="size-3" /> Values are passed to this run only, redacted from logs, and never stored by Sentinel.</span>
            </Field.Hint>
          </Field>
          <FormAlert state={formLevelState(state)} />
          <div><SubmitButton pendingLabel="Sending…">Provide &amp; retry</SubmitButton></div>
        </form>
      </Card.Body>
    </Card>
  );
}
