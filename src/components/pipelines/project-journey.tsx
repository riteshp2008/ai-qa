import Link from "next/link";

import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export type JourneyStep = { key: string; label: string; done: boolean; href?: string };

/**
 * The guided path every project follows:
 * organization → project → repository → AI test pipeline → pull request.
 */
export function ProjectJourney({ steps }: { steps: JourneyStep[] }) {
  const current = steps.findIndex((step) => !step.done);
  return (
    <nav aria-label="Setup progress" className="mb-6 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 text-[13px]">
        {steps.map((step, index) => {
          const state = step.done ? "done" : index === current ? "current" : "upcoming";
          const content = (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition",
                state === "done" && "border-brand/30 bg-brand-soft text-brand-ink",
                state === "current" && "border-brand bg-surface font-medium text-ink shadow-xs ring-4 ring-brand/10",
                state === "upcoming" && "border-line bg-surface text-subtle",
              )}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className={cn("grid size-5 place-items-center rounded-full text-[11px] font-semibold", state === "done" ? "bg-brand text-white dark:text-[#04201d]" : state === "current" ? "bg-ink text-canvas" : "bg-surface-sunken")}>
                {step.done ? <CheckIcon className="size-3" /> : index + 1}
              </span>
              {step.label}
            </span>
          );
          return (
            <li key={step.key} className="flex items-center gap-2">
              {step.href && state === "current" ? <Link href={step.href} prefetch>{content}</Link> : content}
              {index < steps.length - 1 && <span className={cn("h-px w-6", step.done ? "bg-brand/40" : "bg-line")} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
