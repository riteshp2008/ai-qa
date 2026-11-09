import { CheckIcon } from "@/components/ui/icons";
import { pipelineStages, stageIndex } from "@/domain/pipelines/lifecycle";
import type { PipelineStatus } from "@/domain/pipelines/types";
import { cn } from "@/lib/utils/cn";

const failedStates: PipelineStatus[] = ["failed", "cancelled", "rejected"];

export function PipelineStepper({ status, lastActiveStage }: { status: PipelineStatus; lastActiveStage?: PipelineStatus }) {
  const stopped = failedStates.includes(status);
  const current = stopped ? stageIndex(lastActiveStage ?? "provisioning") : stageIndex(status);

  return (
    <ol className="grid grid-cols-4 gap-2 sm:grid-cols-7" aria-label="Pipeline progress">
      {pipelineStages.map((stage, index) => {
        const state = index < current ? "done" : index === current ? (stopped ? "stopped" : "active") : "upcoming";
        return (
          <li key={stage.key} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full border text-xs font-semibold transition",
                state === "done" && "border-brand bg-brand text-white dark:text-[#04201d]",
                state === "active" && "border-brand bg-brand-soft text-brand-ink ring-4 ring-brand/15",
                state === "stopped" && "border-danger/50 bg-danger-soft text-danger",
                state === "upcoming" && "border-line bg-surface text-subtle",
              )}
              aria-current={state === "active" ? "step" : undefined}
            >
              {state === "done" ? <CheckIcon className="size-4" /> : state === "active" ? <span className="size-2 animate-pulse rounded-full bg-brand" /> : index + 1}
            </span>
            <span className={cn("text-[11px] sm:text-xs", state === "upcoming" ? "text-subtle" : "text-ink")}>{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
