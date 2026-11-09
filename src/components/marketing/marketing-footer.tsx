import Link from "next/link";

import { site } from "@/lib/seo/site";

export function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-muted sm:flex-row sm:px-8">
        <span>© {site.name} · AI quality control</span>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/sign-in" className="hover:text-ink">Sign in</Link>
          <Link href="/sign-up" className="hover:text-ink">Create account</Link>
        </nav>
      </div>
    </footer>
  );
}
