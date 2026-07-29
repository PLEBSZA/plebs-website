import type { MetadataRoute } from "next";
import { shouldIndexSite, getCanonicalSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl();
  const indexable = shouldIndexSite();

  return {
    rules: {
      userAgent: "*",
      allow: indexable ? "/" : undefined,
      // Only real non-indexable app routes. Cart is a client drawer (no /cart/
      // page) and there is no /account/ route yet — add those back here if/when
      // dedicated pages are introduced.
      disallow: indexable
        ? ["/checkout/", "/admin/", "/order-confirmation/"]
        : "/",
    },
    sitemap: indexable ? `${siteUrl}/sitemap.xml` : undefined,
    host: siteUrl,
  };
}
