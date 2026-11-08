"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { MenuIcon, XIcon } from "@/components/ui/icons";

/** Slide-in navigation for small screens. Closes on route change and Escape. */
export function MobileDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-ink lg:hidden"
        aria-label="Open navigation"
        aria-expanded={open}
      >
        <MenuIcon className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface p-3 shadow-pop">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-2 ml-auto grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-muted"
              aria-label="Close navigation"
            >
              <XIcon />
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
