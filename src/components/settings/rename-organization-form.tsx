"use client";

import { useActionState } from "react";

import { renameOrganizationAction } from "@/app/o/[orgSlug]/settings/actions";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms/action-state";

export function RenameOrganizationForm({ orgSlug, name }: { orgSlug: string; name: string }) {
  const [state, action] = useActionState(renameOrganizationAction.bind(null, orgSlug), idleState);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Organization name" htmlFor="org-rename" error={state.fieldErrors?.name}>
        <Input id="org-rename" name="name" required maxLength={80} defaultValue={state.values?.name ?? name} invalid={Boolean(state.fieldErrors?.name)} />
      </Field>
      <FormAlert state={state.fieldErrors ? { status: "idle" } : state} />
      <div><SubmitButton variant="secondary" pendingLabel="Saving…">Save changes</SubmitButton></div>
    </form>
  );
}
