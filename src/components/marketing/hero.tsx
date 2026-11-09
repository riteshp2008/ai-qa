import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { site } from "@/lib/seo/site";

const proofPoints = ["Scope-checked targets", "Evidence on every run", "Human review when unsure"];

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="mx-auto max-w-4xl px-5 pb-20 pt-14 text-center sm:px-8 sm:pt-24">
      <p data-aos="fade-down" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-xs">
        <span className="size-1.5 animate-pulse rounded-full bg-brand" /> AI quality control for web apps
      </p>
      <h1 id="hero-heading" data-aos="fade-up" data-aos-delay="50" className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
        {site.tagline}
      </h1>
      <p data-aos="fade-up" data-aos-delay="120" className="mx-auto mt-5 max-w-2xl text-base text-muted text-pretty sm:text-lg">
        {site.description}
      </p>
      <div data-aos="fade-up" data-aos-delay="180" className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <ButtonLink href="/sign-up" size="lg">Create free account <ArrowRightIcon /></ButtonLink>
        <ButtonLink href="/sign-in" size="lg" variant="secondary">Sign in</ButtonLink>
      </div>
      <ul data-aos="fade" data-aos-delay="260" className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-muted">
        {proofPoints.map((point) => (
          <li key={point} className="inline-flex items-center gap-1.5"><CheckIcon className="size-3.5 text-brand" />{point}</li>
        ))}
      </ul>
    </section>
  );
}
