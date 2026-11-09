"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

/** Subtle fade/rise on every navigation; mounted from a route `template.tsx`. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </m.div>
  );
}
