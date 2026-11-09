"use client";

import { useActionState } from "react";

import { linkRepositoryAction } from "@/app/o/[orgSlug]/projects/actions";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { GitHubIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { formLevelState, idleState, resetKey } from "@/lib/forms/action-state";

export function LinkRepositoryForm({ orgSlug, projectId }: { orgSlug: string; projectId: string }) {
  const [state, action] = useActionState(linkRepositoryAction.bind(null, orgSlug, projectId), idleState);
  return (
    <form action={action} className="grid gap-2">
      <Field error={state.fieldErrors?.repository}>
        <Field.Label>Link a GitHub repository</Field.Label>
        <div className="flex flex-col gap-2 sm:flex-row" key={resetKey(state)}>
          <div className="relative flex-1">
            <GitHubIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <Input
              name="repository"
              required
              placeholder="owner/repository or github.com URL"
              className="pl-9 font-mono text-[13px]"
              defaultValue={state.status === "error" ? state.values?.repository : undefined}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <SubmitButton variant="secondary" pendingLabel="Verifying…">Link repository</SubmitButton>
        </div>
        <Field.Error />
      </Field>
      <FormAlert state={formLevelState(state)} />
    </form>
  );
}
