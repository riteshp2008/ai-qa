"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

const loadFeatures = () => import("./features").then((module) => module.default);

/**
 * App-wide motion setup. `strict` forbids the heavyweight `motion.*`
 * components so every animation uses the lazily-featured `m.*` ones, and
 * `reducedMotion="user"` honours the OS accessibility setting.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
