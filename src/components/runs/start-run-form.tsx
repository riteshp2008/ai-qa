"use client";

import { useActionState, useState } from "react";

import { startTestRunAction } from "@/app/o/[orgSlug]/projects/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { PlayIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms/action-state";

const examples = [
  "Sign in with the demo account and verify the dashboard loads.",
  "Add an item to the cart and check the subtotal updates.",
  "Submit the contact form with an invalid email and confirm the error.",
];

export function StartRunForm({ orgSlug, projectId, targetUrl }: { orgSlug: string; projectId: string; targetUrl: string }) {
  const [state, action] = useActionState(startTestRunAction.bind(null, orgSlug, projectId), idleState);
  const [instruction, setInstruction] = useState("");
  // A fresh idempotency key per successful submission; retries of the same submission reuse it.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [lastSuccess, setLastSuccess] = useState<string | undefined>();

  if (state.status === "success" && state.message !== lastSuccess) {
    setLastSuccess(state.message);
    setInstruction("");
    setIdempotencyKey(crypto.randomUUID());
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <Field label="What should Sentinel verify?" htmlFor="run-instruction" error={state.fieldErrors?.instruction}>
        <Textarea
          id="run-instruction"
          name="instruction"
          required
          minLength={10}
          maxLength={10000}
          rows={3}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="Describe the user flow and the expected result…"
          invalid={Boolean(state.fieldErrors?.instruction)}
        />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setInstruction(example)}
            className="rounded-full border border-line bg-surface-muted px-2.5 py-1 text-xs text-muted transition hover:border-line-strong hover:text-ink"
          >
            {example.split(" ").slice(0, 4).join(" ")}…
          </button>
        ))}
      </div>
      <Field label="Start URL" htmlFor="run-url" optional error={state.fieldErrors?.url} hint="Must be on the project's origin. Defaults to the project URL.">
        <Input id="run-url" name="url" type="url" placeholder={targetUrl} defaultValue={state.values?.url} invalid={Boolean(state.fieldErrors?.url)} />
      </Field>
      <FormAlert state={state} />
      <div>
        <SubmitButton pendingLabel="Queueing run…"><PlayIcon /> Start test run</SubmitButton>
      </div>
    </form>
  );
}
