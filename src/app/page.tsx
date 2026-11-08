import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon, BuildingIcon, CheckIcon, FolderIcon, GitHubIcon, PlayIcon, ShieldIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

const flow = [
  { icon: BuildingIcon, title: "Organization", body: "Create one, or request to join with an ID. Admins approve from their inbox." },
  { icon: FolderIcon, title: "Projects", body: "Register the apps you're authorized to test. Runs never leave their origin." },
  { icon: GitHubIcon, title: "Repositories", body: "Link GitHub repos so planning understands your routes and changes." },
  { icon: PlayIcon, title: "Test runs", body: "Describe a flow in plain language. Get a traceable, reviewable result." },
];

const principles = [
  ["Authorized by design", "Projects define the target scope before any run can start."],
  ["Honest states", "Queued, failed, and needs-review are never disguised as passed."],
  ["Private by default", "Credentials and evidence stay server-side, scoped to your organization."],
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="grid-backdrop pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:text-ink sm:block">How it works</a>
          <Link href="/sign-in" className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink">Sign in</Link>
          <ButtonLink href="/sign-up" size="sm">Get started</ButtonLink>
        </nav>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-4xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-xs">
            <span className="size-1.5 rounded-full bg-brand" /> AI quality control for web apps
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Know what works before your users do.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted text-pretty sm:text-lg">
            Sentinel turns plain-language testing goals into traceable runs. AI plans the work; deterministic checks and evidence keep the result honest.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/sign-up" size="lg">Create free account <ArrowRightIcon /></ButtonLink>
            <ButtonLink href="/sign-in" size="lg" variant="secondary">Sign in</ButtonLink>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-10 px-5 pb-24 sm:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">One clear path from sign-in to evidence.</h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="relative rounded-xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand-ink"><Icon className="size-[18px]" /></span>
                  <span className="font-mono text-xs text-subtle">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <ShieldIcon className="size-7 text-brand" />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">AI proposes. Evidence decides.</h2>
              <p className="mt-2 text-muted">Built for teams that need to trust the green checkmark.</p>
            </div>
            <ul className="grid gap-5">
              {principles.map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink"><CheckIcon className="size-3" /></span>
                  <p className="text-sm text-muted"><span className="font-medium text-ink">{title}.</span> {body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">Make your next release easier to trust.</h2>
          <p className="mt-3 text-muted">Set up your organization in under a minute.</p>
          <ButtonLink href="/sign-up" size="lg" className="mt-8">Get started <ArrowRightIcon /></ButtonLink>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-muted sm:flex-row sm:px-8">
          <span>© Sentinel · AI quality control</span>
          <div className="flex gap-4"><Link href="/sign-in" className="hover:text-ink">Sign in</Link><Link href="/sign-up" className="hover:text-ink">Create account</Link></div>
        </div>
      </footer>
    </div>
  );
}
