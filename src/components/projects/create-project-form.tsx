"use client";

import { useActionState } from "react";

import { createProjectAction } from "@/app/o/[orgSlug]/projects/actions";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms/action-state";

export function CreateProjectForm({ orgSlug }: { orgSlug: string }) {
  const [state, action] = useActionState(createProjectAction.bind(null, orgSlug), idleState);
  return (
    <form action={action} className="grid gap-5">
      <Field label="Project name" htmlFor="project-name" error={state.fieldErrors?.name}>
        <Input id="project-name" name="name" required maxLength={100} placeholder="Checkout web app" defaultValue={state.values?.name} invalid={Boolean(state.fieldErrors?.name)} autoFocus />
      </Field>
      <Field
        label="Application URL"
        htmlFor="project-url"
        error={state.fieldErrors?.targetUrl}
        hint="Public HTTPS origin your team owns or is authorized to test. Runs are restricted to this origin."
      >
        <Input id="project-url" name="targetUrl" type="url" required placeholder="https://staging.example.com" defaultValue={state.values?.targetUrl} invalid={Boolean(state.fieldErrors?.targetUrl)} />
      </Field>
      <FormAlert state={state.fieldErrors ? { status: "idle" } : state} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Creating project…">Create project</SubmitButton>
        <ButtonLink href={`/o/${orgSlug}/projects`} variant="ghost">Cancel</ButtonLink>
      </div>
    </form>
  );
}
