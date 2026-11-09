"use client";

import { useActionState } from "react";

import { createInviteAction } from "@/app/o/[orgSlug]/members/actions";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { MailIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { formLevelState, idleState, resetKey } from "@/lib/forms/action-state";

export function InviteForm({ orgSlug }: { orgSlug: string }) {
  const [state, action] = useActionState(createInviteAction.bind(null, orgSlug), idleState);
  const inviteUrl = state.status === "success" ? state.data?.inviteUrl : undefined;

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_140px] lg:grid-cols-1 xl:grid-cols-[1fr_140px]" key={resetKey(state)}>
        <Field error={state.fieldErrors?.email}>
          <Field.Label>Email address</Field.Label>
          <Input name="email" type="email" inputMode="email" autoComplete="off" required placeholder="teammate@company.com" defaultValue={state.status === "error" ? state.values?.email : undefined} />
          <Field.Error />
        </Field>
        <Field>
          <Field.Label>Role</Field.Label>
          <Select name="role" defaultValue={state.values?.role ?? "member"}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
      </div>
      <FormAlert state={formLevelState(state)} />
      {inviteUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-muted p-2 pl-3">
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{inviteUrl}</code>
          <CopyButton value={inviteUrl} label="Copy link" />
        </div>
      )}
      <div>
        <SubmitButton pendingLabel="Sending invite…"><MailIcon /> Send invite</SubmitButton>
      </div>
    </form>
  );
}
