"use client";

import { useActionState, useState } from "react";

import { createOrganizationAction } from "@/app/onboarding/actions";
import { slugifyOrganizationName } from "@/domain/organizations/schemas";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { idleState } from "@/lib/forms/action-state";

export function CreateOrganizationForm() {
  const [state, action] = useActionState(createOrganizationAction, idleState);
  const [name, setName] = useState(state.values?.name ?? "");
  const [slug, setSlug] = useState(state.values?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(state.values?.slug));

  return (
    <form action={action} className="grid gap-4">
      <Field label="Organization name" htmlFor="org-name" error={state.fieldErrors?.name}>
        <Input
          id="org-name"
          name="name"
          required
          maxLength={80}
          placeholder="Acme Inc."
          value={name}
          invalid={Boolean(state.fieldErrors?.name)}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(slugifyOrganizationName(event.target.value));
          }}
        />
      </Field>
      <Field
        label="Organization ID"
        htmlFor="org-slug"
        error={state.fieldErrors?.slug}
        hint="Teammates use this ID to request access. Lowercase letters, numbers, and hyphens."
      >
        <div className="flex rounded-lg shadow-xs">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-line-strong bg-surface-muted px-3 font-mono text-xs text-subtle">sentinel/</span>
          <Input
            id="org-slug"
            name="slug"
            required
            maxLength={48}
            placeholder="acme"
            className="rounded-l-none font-mono shadow-none"
            value={slug}
            invalid={Boolean(state.fieldErrors?.slug)}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
          />
        </div>
      </Field>
      <FormAlert state={state.fieldErrors ? { status: "idle" } : state} />
      <SubmitButton size="lg" className="w-full" pendingLabel="Creating organization…">
        Create organization <ArrowRightIcon />
      </SubmitButton>
    </form>
  );
}
