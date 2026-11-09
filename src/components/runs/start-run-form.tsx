"use client";

import { useActionState, useCallback, useRef, useState } from "react";

import { startTestRunAction } from "@/app/o/[orgSlug]/projects/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { PlayIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState, resetKey, type ActionState } from "@/lib/forms/action-state";

const examples = [
  { label: "Sign-in flow", text: "Sign in with the demo account and verify the dashboard loads." },
  { label: "Cart subtotal", text: "Add an item to the cart and check the subtotal updates." },
  { label: "Form validation", text: "Submit the contact form with an invalid email and confirm the error." },
] as const;

type StartRunFormProps = { orgSlug: string; projectId: string; targetUrl: string };

export function StartRunForm({ orgSlug, projectId, targetUrl }: StartRunFormProps) {
  const [state, action] = useActionState(startTestRunAction.bind(null, orgSlug, projectId), idleState);
  return (
    <form action={action} className="grid gap-4">
      {/* Each successful run remounts the fields: inputs clear and a fresh idempotency key is minted. */}
      <RunFields key={resetKey(state)} state={state} targetUrl={targetUrl} />
      <FormAlert state={state} />
      <div>
        <SubmitButton pendingLabel="Queueing run…"><PlayIcon /> Start test run</SubmitButton>
      </div>
    </form>
  );
}

function RunFields({ state, targetUrl }: { state: ActionState; targetUrl: string }) {
  // Stable for this mount, so retrying a failed submission reuses the key (no duplicate runs).
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const instructionRef = useRef<HTMLTextAreaElement>(null);
  const retained = state.status === "error" ? state.values : undefined;

  const applyExample = useCallback((text: string) => {
    const field = instructionRef.current;
    if (!field) return;
    field.value = text;
    field.focus();
  }, []);

  return (
    <>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <Field error={state.fieldErrors?.instruction}>
        <Field.Label>What should Sentinel verify?</Field.Label>
        <Textarea ref={instructionRef} name="instruction" required minLength={10} maxLength={10000} rows={3} placeholder="Describe the user flow and the expected result…" defaultValue={retained?.instruction} />
        <Field.Error />
      </Field>
      <div className="flex flex-wrap gap-1.5" aria-label="Example instructions">
        {examples.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => applyExample(example.text)}
            className="rounded-full border border-line bg-surface-muted px-2.5 py-1 text-xs text-muted transition hover:border-line-strong hover:text-ink active:scale-95"
          >
            {example.label}
          </button>
        ))}
      </div>
      <Field error={state.fieldErrors?.url}>
        <Field.Label optional>Start URL</Field.Label>
        <Input name="url" type="url" inputMode="url" placeholder={targetUrl} defaultValue={retained?.url} />
        <Field.Hint>Must be on the project&apos;s origin. Defaults to the project URL.</Field.Hint>
        <Field.Error />
      </Field>
    </>
  );
}
