import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { SetupStep } from "@/server/services/overview.service";

const stepCopy: Record<SetupStep["key"], { title: string; description: string; cta: string; href: (slug: string) => string }> = {
  project: { title: "Register an application", description: "Add the web app your team is authorized to test.", cta: "Create project", href: (s) => `/o/${s}/projects/new` },
  repository: { title: "Link a GitHub repository", description: "Give test planning context from your source code.", cta: "Open projects", href: (s) => `/o/${s}/projects` },
  team: { title: "Bring in your team", description: "Invite teammates or share your organization ID.", cta: "Manage members", href: (s) => `/o/${s}/members` },
  run: { title: "Run your first check", description: "Describe a flow in plain language and queue a run.", cta: "Start a run", href: (s) => `/o/${s}/projects` },
};

export function SetupChecklist({ steps, orgSlug }: { steps: SetupStep[]; orgSlug: string }) {
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;
  const nextKey = steps.find((step) => !step.done)?.key;

  return (
    <Card className="overflow-hidden" aria-labelledby="setup-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 id="setup-heading" className="text-[15px] font-semibold">Get set up</h2>
          <p className="mt-0.5 text-[13px] text-muted">{done} of {steps.length} complete</p>
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Setup progress">
          <div className="h-full origin-left rounded-full bg-brand transition-transform duration-700" style={{ transform: `scaleX(${done / steps.length})` }} />
        </div>
      </div>
      <ol className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {steps.map((step, index) => {
          const copy = stepCopy[step.key];
          return (
            <li key={step.key} className={cn("flex flex-col p-5", step.key === nextKey && "bg-brand-soft/50")}>
              <span className={cn("grid size-6 place-items-center rounded-full text-xs font-semibold", step.done ? "bg-brand text-white dark:text-[#04201d]" : "border border-line-strong text-muted")}>
                {step.done ? <CheckIcon className="size-3.5" /> : index + 1}
              </span>
              <p className={cn("mt-3 text-sm font-medium", step.done && "text-muted line-through decoration-subtle")}>{copy.title}</p>
              <p className="mt-1 text-[13px] text-muted">{copy.description}</p>
              {!step.done && (
                <Link href={copy.href(orgSlug)} prefetch className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand-ink hover:underline">
                  {copy.cta} <ArrowRightIcon className="size-3.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
