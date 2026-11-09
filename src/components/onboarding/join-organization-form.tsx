"use client";

import { useActionState } from "react";

import { requestToJoinAction } from "@/app/onboarding/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { MailIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { formLevelState, idleState, resetKey } from "@/lib/forms/action-state";

export function JoinOrganizationForm() {
  const [state, action] = useActionState(requestToJoinAction, idleState);
  const retained = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="grid gap-4">
      {/* Remounting on success clears the inputs without controlled state. */}
      <div key={resetKey(state)} className="grid gap-4">
        <Field error={state.fieldErrors?.organizationId}>
          <Field.Label>Organization ID</Field.Label>
          <Input name="organizationId" required placeholder="acme" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="font-mono" defaultValue={retained?.organizationId} />
          <Field.Hint>Ask an admin — it&apos;s shown in their organization settings.</Field.Hint>
          <Field.Error />
        </Field>
        <Field error={state.fieldErrors?.message}>
          <Field.Label optional>Note to admins</Field.Label>
          <Textarea name="message" rows={2} maxLength={500} className="min-h-16" placeholder="Hi! I'm joining the QA team." defaultValue={retained?.message} />
          <Field.Error />
        </Field>
      </div>
      <FormAlert state={formLevelState(state)} />
      <SubmitButton variant="secondary" size="lg" className="w-full" pendingLabel="Sending request…">
        <MailIcon /> Request to join
      </SubmitButton>
    </form>
  );
}
