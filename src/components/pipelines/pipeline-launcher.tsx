"use client";

import { useActionState, useState } from "react";

import { startPipelineAction } from "@/app/o/[orgSlug]/projects/[projectId]/pipelines/actions";
import { Field, Select, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SparkIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SuiteKind } from "@/domain/pipelines/types";
import type { LinkedRepository } from "@/domain/repositories/github";
import { formLevelState, idleState } from "@/lib/forms/action-state";
import { cn } from "@/lib/utils/cn";

const suiteOptions: Array<{ kind: SuiteKind; title: string; description: string }> = [
  { kind: "e2e", title: "End-to-end", description: "Playwright user journeys in a real browser" },
  { kind: "api", title: "API", description: "Endpoint status codes, shapes, and validation" },
  { kind: "unit", title: "Unit", description: "Pure logic with dependencies mocked" },
];

export function PipelineLauncher({ orgSlug, projectId, repositories }: { orgSlug: string; projectId: string; repositories: LinkedRepository[] }) {
  const [state, action] = useActionState(startPipelineAction.bind(null, orgSlug, projectId), idleState);
  const [selected, setSelected] = useState<Set<SuiteKind>>(() => new Set(["e2e", "api", "unit"]));

  const toggle = (kind: SuiteKind) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  return (
    <form action={action} className="grid gap-5">
      <Field error={state.fieldErrors?.repositoryId}>
        <Field.Label>Repository</Field.Label>
        <Select name="repositoryId" defaultValue={state.values?.repositoryId ?? repositories[0]?.id}>
          {repositories.map((repository) => <option key={repository.id} value={repository.id}>{repository.fullName} ({repository.defaultBranch})</option>)}
        </Select>
      </Field>

      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-[13px] font-medium">Tests to write</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {suiteOptions.map((option) => {
            const checked = selected.has(option.kind);
            return (
              <label
                key={option.kind}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--ring)]",
                  checked ? "border-brand bg-brand-soft/60" : "border-line-strong bg-surface hover:border-subtle",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name="suites" value={option.kind} checked={checked} onChange={() => toggle(option.kind)} className="size-4 accent-[var(--brand)]" />
                  {option.title}
                </span>
                <span className="text-xs text-muted">{option.description}</span>
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.suites && <p role="alert" className="text-[13px] text-danger">{state.fieldErrors.suites[0]}</p>}
      </fieldset>

      <Field error={state.fieldErrors?.instructions}>
        <Field.Label optional>Guidance for the agents</Field.Label>
        <Textarea name="instructions" rows={3} maxLength={4000} defaultValue={state.values?.instructions} placeholder="Focus on checkout and the /api/orders endpoints. Skip the admin area." />
        <Field.Hint>Agents read this as trusted instructions from you.</Field.Hint>
      </Field>

      <FormAlert state={formLevelState(state)} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton disabled={selected.size === 0} pendingLabel="Starting agents…"><SparkIcon /> Run AI test pipeline</SubmitButton>
        <p className="text-xs text-muted">Runs in an isolated sandbox. Nothing is pushed until you approve.</p>
      </div>
    </form>
  );
}
