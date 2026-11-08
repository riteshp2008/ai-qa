"use client";

import { useActionState } from "react";

import { linkRepositoryAction } from "@/app/o/[orgSlug]/projects/actions";
import { Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { GitHubIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms/action-state";

export function LinkRepositoryForm({ orgSlug, projectId }: { orgSlug: string; projectId: string }) {
  const [state, action] = useActionState(linkRepositoryAction.bind(null, orgSlug, projectId), idleState);
  const error = state.fieldErrors?.repository?.[0];
  return (
    <form action={action} className="grid gap-2">
      <label htmlFor="repository" className="text-[13px] font-medium">Link a GitHub repository</label>
      <div className="flex flex-col gap-2 sm:flex-row" key={state.status === "success" ? state.message : "form"}>
        <div className="relative flex-1">
          <GitHubIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <Input
            id="repository"
            name="repository"
            required
            placeholder="owner/repository or https://github.com/owner/repository"
            className="pl-9 font-mono text-[13px]"
            defaultValue={state.status === "error" ? state.values?.repository : undefined}
            invalid={Boolean(error)}
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <SubmitButton variant="secondary" pendingLabel="Verifying…">Link repository</SubmitButton>
      </div>
      {error ? <p id="repository-error" className="text-[13px] text-danger">{error}</p> : <FormAlert state={state} />}
    </form>
  );
}
