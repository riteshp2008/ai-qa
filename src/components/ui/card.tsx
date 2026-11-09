import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Compound card: <Card> with <Card.Header>, <Card.Body>, <Card.Footer>.
 * Server-safe (no client state), so it can be composed from any component.
 */
function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-line bg-surface shadow-card", className)} {...props} />;
}

function CardHeader({ title, description, action, className, id }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string; id?: string }) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"footer">) {
  return <footer className={cn("flex items-center justify-end gap-2 border-t border-line bg-surface-muted/50 px-5 py-3", className)} {...props} />;
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };
