import type { MetadataRoute } from "next";

import { publicRoutes, siteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency,
    priority,
  }));
}
