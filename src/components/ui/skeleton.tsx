import { cn } from "@/lib/utils/cn";

/** Compound loading placeholders: <Skeleton>, <Skeleton.List>, <Skeleton.Grid>. */
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-sunken", className)} aria-hidden="true" />;
}

function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-line", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <Skeleton className="size-8 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SkeletonGrid({ count = 4, className, itemClassName = "h-24" }: { count?: number; className?: string; itemClassName?: string }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className={cn("rounded-xl", itemClassName)} />)}
    </div>
  );
}

Skeleton.List = SkeletonList;
Skeleton.Grid = SkeletonGrid;

export { Skeleton };
