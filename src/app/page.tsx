import { AosInit } from "@/components/motion/aos-init";
import { CallToAction } from "@/components/marketing/call-to-action";
import { Hero } from "@/components/marketing/hero";
import { flowSteps, HowItWorks } from "@/components/marketing/how-it-works";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Principles } from "@/components/marketing/principles";
import { JsonLd } from "@/lib/seo/json-ld";
import { site, siteUrl } from "@/lib/seo/site";

const structuredData = () => ({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: site.name, url: siteUrl(), logo: `${siteUrl()}/icon` },
    {
      "@type": "SoftwareApplication",
      name: site.name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description: site.description,
      url: siteUrl(),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "HowTo",
      name: "Run AI quality checks on a web app with Sentinel",
      step: flowSteps.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.title, text: step.body })),
    },
  ],
});

/** Fully static marketing page; AOS loads after hydration and only adds motion. */
export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <JsonLd data={structuredData()} />
      <AosInit />
      <div className="grid-backdrop pointer-events-none absolute inset-x-0 top-0 h-[640px]" aria-hidden="true" />
      <MarketingHeader />
      <main className="relative">
        <Hero />
        <HowItWorks />
        <Principles />
        <CallToAction />
      </main>
      <MarketingFooter />
    </div>
  );
}
