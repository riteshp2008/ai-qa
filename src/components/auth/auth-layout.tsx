import type { ReactNode } from "react";

import { CheckIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

const steps = [
  "Create or join your organization",
  "Register the apps you're authorized to test",
  "Link GitHub repositories for context",
  "Run AI-planned checks with evidence",
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-subtle">Only test applications you own or are authorized to test.</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-line bg-surface lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">How Sentinel works</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance">From sign-in to your first verified run in minutes.</h2>
          <ol className="mt-8 grid gap-4">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 rounded-xl border border-line bg-surface/80 px-4 py-3 shadow-card backdrop-blur">
                <span className="grid size-7 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">{index + 1}</span>
                <span className="text-sm text-ink">{step}</span>
                {index === 0 && <CheckIcon className="ml-auto text-brand" />}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </main>
  );
}
