"use client";

import { useActionState, useCallback, useState, type ChangeEvent } from "react";

import { createOrganizationAction } from "@/app/onboarding/actions";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { slugifyOrganizationName } from "@/domain/organizations/schemas";
import { formLevelState, idleState } from "@/lib/forms/action-state";

/** Keeps the organization ID in sync with the name until the user edits the ID themselves. */
function useLinkedSlug(initialName = "", initialSlug = "") {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialSlug));

  const onNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    if (!slugEdited) setSlug(slugifyOrganizationName(event.target.value));
  }, [slugEdited]);

  const onSlugChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true);
    setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }, []);

  return { name, slug, onNameChange, onSlugChange };
}

export function CreateOrganizationForm() {
  const [state, action] = useActionState(createOrganizationAction, idleState);
  const { name, slug, onNameChange, onSlugChange } = useLinkedSlug(state.values?.name, state.values?.slug);

  return (
    <form action={action} className="grid gap-4">
      <Field error={state.fieldErrors?.name}>
        <Field.Label>Organization name</Field.Label>
        <Input name="name" required maxLength={80} placeholder="Acme Inc." autoComplete="organization" value={name} onChange={onNameChange} />
        <Field.Error />
      </Field>
      <Field error={state.fieldErrors?.slug}>
        <Field.Label>Organization ID</Field.Label>
        <div className="flex rounded-lg shadow-xs">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-line-strong bg-surface-muted px-3 font-mono text-xs text-subtle" aria-hidden="true">sentinel/</span>
          <Input name="slug" required maxLength={48} placeholder="acme" className="rounded-l-none font-mono shadow-none" autoCapitalize="none" spellCheck={false} value={slug} onChange={onSlugChange} />
        </div>
        <Field.Hint>Teammates use this ID to request access. Lowercase letters, numbers, and hyphens.</Field.Hint>
        <Field.Error />
      </Field>
      <FormAlert state={formLevelState(state)} />
      <SubmitButton size="lg" className="w-full" pendingLabel="Creating organization…">
        Create organization <ArrowRightIcon />
      </SubmitButton>
    </form>
  );
}
