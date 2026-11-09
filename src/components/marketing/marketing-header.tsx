import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-canvas/70 backdrop-blur-lg supports-[backdrop-filter]:bg-canvas/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <a href="#how-it-works" className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink sm:block">How it works</a>
          <a href="#trust" className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink sm:block">Trust</a>
          <Link href="/sign-in" className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">Sign in</Link>
          <ButtonLink href="/sign-up" size="sm">Get started</ButtonLink>
        </nav>
      </div>
    </header>
  );
}
