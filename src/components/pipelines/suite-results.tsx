import { Badge, type BadgeTone } from "@/components/ui/badge";
import { AlertIcon } from "@/components/ui/icons";
import type { PipelineResults, SuiteKind, SuiteStatus } from "@/domain/pipelines/types";

const titles: Record<SuiteKind, string> = { e2e: "End-to-end", api: "API", unit: "Unit" };
const tones: Record<SuiteStatus, BadgeTone> = { passed: "success", failed: "danger", partial: "warning", skipped: "neutral", blocked: "neutral" };

export function SuiteResults({ results, suites }: { results: PipelineResults; suites: SuiteKind[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {suites.map((suite) => {
        const result = results.suites?.[suite];
        return (
          <div key={suite} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{titles[suite]}</p>
              {result ? <Badge tone={tones[result.status]} dot>{result.status}</Badge> : <Badge>pending</Badge>}
            </div>
            {result ? (
              <>
                <p className="mt-3 text-2xl font-semibold tabular-nums">
                  {result.passed}<span className="text-base text-muted"> passed</span>
                  {result.failed > 0 && <span className="ml-2 text-base text-danger">{result.failed} failed</span>}
                </p>
                <p className="mt-1 text-xs text-muted">{result.files.length} file(s) · {result.iterations} agent turns</p>
                <p className="mt-2 line-clamp-3 text-[13px] text-muted">{result.summary}</p>
                {result.suspectedBugs.length > 0 && (
                  <div className="mt-3 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <p className="flex items-center gap-1 font-medium"><AlertIcon className="size-3.5" /> Suspected app bugs</p>
                    <ul className="mt-1 list-disc pl-4">{result.suspectedBugs.slice(0, 3).map((bug) => <li key={bug}>{bug}</li>)}</ul>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-[13px] text-muted">Agents haven&apos;t reported yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
