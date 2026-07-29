import type { MetadataRoute } from "next";
import { shouldIndexSite, getCanonicalSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl();
  const indexable = shouldIndexSite();

  return {
    rules: {
      userAgent: "*",
      allow: indexable ? "/" : undefined,
      disallow: indexable
        ? [
            "/cart/",
            "/checkout/",
            "/account/",
            "/admin/",
            "/order-confirmation/",
          ]
        : "/",
    },
    sitemap: indexable ? `${siteUrl}/sitemap.xml` : undefined,
    host: siteUrl,
  };
}
