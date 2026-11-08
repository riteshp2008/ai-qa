"use client";

import { useActionState } from "react";

import { requestToJoinAction } from "@/app/onboarding/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { MailIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms/action-state";

export function JoinOrganizationForm() {
  const [state, action] = useActionState(requestToJoinAction, idleState);
  // Clear inputs after a successful request by remounting the fields.
  const formKey = state.status === "success" ? state.message : "form";

  return (
    <form action={action} className="grid gap-4">
      <div key={formKey} className="grid gap-4">
        <Field
          label="Organization ID"
          htmlFor="join-org-id"
          error={state.fieldErrors?.organizationId}
          hint="Ask an admin — it's shown in their organization settings."
        >
          <Input
            id="join-org-id"
            name="organizationId"
            required
            placeholder="acme"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono"
            defaultValue={state.status === "error" ? state.values?.organizationId : undefined}
            invalid={Boolean(state.fieldErrors?.organizationId)}
          />
        </Field>
        <Field label="Note to admins" htmlFor="join-message" optional error={state.fieldErrors?.message}>
          <Textarea
            id="join-message"
            name="message"
            rows={2}
            maxLength={500}
            className="min-h-16"
            placeholder="Hi! I'm joining the QA team."
            defaultValue={state.status === "error" ? state.values?.message : undefined}
          />
        </Field>
      </div>
      <FormAlert state={state.fieldErrors ? { status: "idle" } : state} />
      <SubmitButton variant="secondary" size="lg" className="w-full" pendingLabel="Sending request…">
        <MailIcon /> Request to join
      </SubmitButton>
    </form>
  );
}
