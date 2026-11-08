import { initialsOf } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const palette = [
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

function hash(value: string) {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold",
        size === "sm" ? "size-6 text-[10px]" : size === "lg" ? "size-10 text-sm" : "size-8 text-xs",
        palette[hash(name) % palette.length],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Square avatar for organizations. */
export function OrgAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold", palette[hash(name) % palette.length], className)}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
