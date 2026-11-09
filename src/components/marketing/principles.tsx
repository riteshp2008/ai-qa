import { CheckIcon, ShieldIcon } from "@/components/ui/icons";

const principles = [
  ["Authorized by design", "Projects define the target scope before any run can start."],
  ["Honest states", "Queued, failed, and needs-review are never disguised as passed."],
  ["Private by default", "Credentials and evidence stay server-side, scoped to your organization."],
] as const;

export function Principles() {
  return (
    <section id="trust" aria-labelledby="trust-heading" className="scroll-mt-24 border-y border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <div data-aos="fade-right">
          <ShieldIcon className="size-7 text-brand" />
          <h2 id="trust-heading" className="mt-4 text-2xl font-semibold tracking-tight">AI proposes. Evidence decides.</h2>
          <p className="mt-2 text-muted">Built for teams that need to trust the green checkmark.</p>
        </div>
        <ul className="grid gap-5">
          {principles.map(([title, body], index) => (
            <li key={title} className="flex gap-3" data-aos="fade-left" data-aos-delay={index * 80}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink"><CheckIcon className="size-3" /></span>
              <p className="text-sm text-muted"><span className="font-medium text-ink">{title}.</span> {body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
