import { AlertIcon, CheckIcon, PlayIcon, ShieldIcon, SparkIcon, UsersIcon } from "@/components/ui/icons";
import type { PipelineEvent, PipelineEventKind } from "@/domain/pipelines/types";
import { cn } from "@/lib/utils/cn";

const kindStyle: Record<PipelineEventKind, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  stage: { icon: PlayIcon, className: "bg-sky-500/12 text-sky-700 dark:text-sky-300" },
  thought: { icon: SparkIcon, className: "bg-violet-500/12 text-violet-700 dark:text-violet-300" },
  tool: { icon: PlayIcon, className: "bg-surface-sunken text-muted" },
  result: { icon: CheckIcon, className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  guardrail: { icon: ShieldIcon, className: "bg-amber-500/14 text-amber-700 dark:text-amber-300" },
  review: { icon: CheckIcon, className: "bg-teal-500/12 text-teal-700 dark:text-teal-300" },
  hitl: { icon: UsersIcon, className: "bg-brand-soft text-brand-ink" },
  error: { icon: AlertIcon, className: "bg-red-500/12 text-red-700 dark:text-red-300" },
};

const timeFormat = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Live log of what each agent did: stages, tool calls, guardrail hits, and human decisions. */
export function PipelineTimeline({ events }: { events: PipelineEvent[] }) {
  if (events.length === 0) return <p className="px-5 py-6 text-sm text-muted">Waiting for the first agent to start…</p>;
  return (
    <ol className="max-h-[560px] overflow-y-auto px-5 py-3" aria-live="polite">
      {events.map((event) => {
        const style = kindStyle[event.kind];
        const Icon = style.icon;
        return (
          <li key={event.id} className="relative flex gap-3 pb-3 last:pb-0">
            <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", style.className)}><Icon className="size-3.5" /></span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="font-medium text-ink">{event.agent}</span>
                <time className="font-mono text-subtle" dateTime={event.createdAt.toISOString()}>{timeFormat.format(event.createdAt)}</time>
              </p>
              <p className={cn("mt-0.5 whitespace-pre-wrap break-words text-[13px]", event.kind === "tool" ? "font-mono text-xs text-muted" : "text-ink/90")}>{event.message}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
