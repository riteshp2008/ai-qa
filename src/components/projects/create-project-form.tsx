"use client";

import { useActionState } from "react";

import { createProjectAction } from "@/app/o/[orgSlug]/projects/actions";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { formLevelState, idleState } from "@/lib/forms/action-state";

export function CreateProjectForm({ orgSlug }: { orgSlug: string }) {
  const [state, action] = useActionState(createProjectAction.bind(null, orgSlug), idleState);
  return (
    <form action={action} className="grid gap-5">
      <Field error={state.fieldErrors?.name}>
        <Field.Label>Project name</Field.Label>
        <Input name="name" required maxLength={100} placeholder="Checkout web app" defaultValue={state.values?.name} autoFocus />
        <Field.Error />
      </Field>
      <Field error={state.fieldErrors?.targetUrl}>
        <Field.Label>Application URL</Field.Label>
        <Input name="targetUrl" type="url" inputMode="url" required placeholder="https://staging.example.com" defaultValue={state.values?.targetUrl} />
        <Field.Hint>Public HTTPS origin your team owns or is authorized to test. Runs are restricted to this origin.</Field.Hint>
        <Field.Error />
      </Field>
      <FormAlert state={formLevelState(state)} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Creating project…">Create project</SubmitButton>
        <ButtonLink href={`/o/${orgSlug}/projects`} variant="ghost">Cancel</ButtonLink>
      </div>
    </form>
  );
}
