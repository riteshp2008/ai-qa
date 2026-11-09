import type { Metadata } from "next";

import { getAppUrl } from "@/lib/config";

/** Canonical product facts reused by metadata, the manifest, OG images, and JSON-LD. */
export const site = {
  name: "Sentinel",
  title: "Sentinel · AI quality control for web apps",
  tagline: "Know what works before your users do.",
  description:
    "Sentinel turns plain-language testing goals into traceable browser runs. AI plans the work; deterministic checks and evidence keep the result honest.",
  keywords: ["AI QA", "automated testing", "end-to-end testing", "web app testing", "quality engineering", "test automation", "regression testing"],
  themeColor: "#0f766e",
} as const;

export const siteUrl = () => getAppUrl();

/** Metadata for pages that must never appear in search results (app, invites, onboarding). */
export const privatePageMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/** Public routes listed in the sitemap. Keep in sync with robots.ts. */
export const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/sign-up", priority: 0.8, changeFrequency: "monthly" },
  { path: "/sign-in", priority: 0.5, changeFrequency: "yearly" },
] as const;

export const privatePathPrefixes = ["/o/", "/onboarding", "/invite/", "/dashboard", "/api/", "/auth/"] as const;
