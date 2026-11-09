"use client";

import { m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

/** Staggers the entrance of its RevealItem children. */
export function RevealRoot({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const Component = as === "ul" ? m.ul : as === "ol" ? m.ol : m.div;
  return (
    <Component className={className} variants={container} initial="hidden" animate="visible">
      {children}
    </Component>
  );
}

export function RevealItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Component = as === "li" ? m.li : m.div;
  return <Component className={className} variants={item}>{children}</Component>;
}
