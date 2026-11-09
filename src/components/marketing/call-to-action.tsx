import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";

export function CallToAction() {
  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8" data-aos="zoom-in-up">
      <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight text-balance">Make your next release easier to trust.</h2>
      <p className="mt-3 text-muted">Set up your organization in under a minute.</p>
      <ButtonLink href="/sign-up" size="lg" className="mt-8">Get started <ArrowRightIcon /></ButtonLink>
    </section>
  );
}
