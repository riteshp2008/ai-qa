import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && <div className="mb-4 grid size-11 place-items-center rounded-xl border border-line bg-surface-muted text-muted [&_svg]:size-5">{icon}</div>}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted text-pretty">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
