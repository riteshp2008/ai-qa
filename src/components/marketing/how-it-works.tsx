import { BuildingIcon, FolderIcon, GitHubIcon, PlayIcon } from "@/components/ui/icons";

export const flowSteps = [
  { icon: BuildingIcon, title: "Organization", body: "Create one, or request to join with an ID. Admins approve from their inbox." },
  { icon: FolderIcon, title: "Projects", body: "Register the apps you're authorized to test. Runs never leave their origin." },
  { icon: GitHubIcon, title: "Repositories", body: "Link GitHub repos so planning understands your routes and changes." },
  { icon: PlayIcon, title: "Test runs", body: "Describe a flow in plain language. Get a traceable, reviewable result." },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24 sm:px-8">
      <div className="mb-10 text-center" data-aos="fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">How it works</p>
        <h2 id="how-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">One clear path from sign-in to evidence.</h2>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {flowSteps.map(({ icon: Icon, title, body }, index) => (
          <li
            key={title}
            data-aos="fade-up"
            data-aos-delay={index * 80}
            className="relative rounded-xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
          >
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
  );
}
