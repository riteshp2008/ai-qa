import type { ReactNode } from "react";

export function StatCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between text-[13px] text-muted">
        {label}
        {icon && <span className="text-subtle [&_svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted">{detail}</p>}
    </div>
  );
}
