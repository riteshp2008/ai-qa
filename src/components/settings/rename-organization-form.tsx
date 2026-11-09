"use client";

import { useActionState } from "react";

import { renameOrganizationAction } from "@/app/o/[orgSlug]/settings/actions";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { formLevelState, idleState } from "@/lib/forms/action-state";

export function RenameOrganizationForm({ orgSlug, name }: { orgSlug: string; name: string }) {
  const [state, action] = useActionState(renameOrganizationAction.bind(null, orgSlug), idleState);
  return (
    <form action={action} className="grid gap-4">
      <Field error={state.fieldErrors?.name}>
        <Field.Label>Organization name</Field.Label>
        <Input name="name" required maxLength={80} defaultValue={state.values?.name ?? name} />
        <Field.Error />
      </Field>
      <FormAlert state={formLevelState(state)} />
      <div><SubmitButton variant="secondary" pendingLabel="Saving…">Save changes</SubmitButton></div>
    </form>
  );
}
