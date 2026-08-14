import type { MetadataRoute } from "next";
import { shouldIndexSite, getCanonicalSiteUrl } from "@/lib/env";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!shouldIndexSite()) {
    return [];
  }

  const lastModified = new Date();
  const siteUrl = getCanonicalSiteUrl();

  // Include only canonical indexable URLs. No inflated priority or fake frequencies.
  // Merchant feeds are noindex and must not appear here.
  return siteConfig.routes
    .filter((route) => !route.path.startsWith("/feeds"))
    .map((route) => ({
      url: new URL(route.path, siteUrl).toString(),
      lastModified,
    }));
}
