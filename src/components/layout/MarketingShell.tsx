import { Suspense } from "react";
import { AccountNav, AccountNavFallback } from "@/components/layout/AccountNav";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ConversionEvents } from "@/components/analytics/ConversionEvents";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CartProvider } from "@/components/cart/CartProvider";
import { StorefrontCatalogueProvider } from "@/components/commerce/StorefrontCatalogueProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import {
  buildGraph,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/structured-data";

/**
 * Shared marketing chrome + catalogue provider.
 * Used by `(site)/layout` and the root `not-found` so 404 keeps the same shell.
 */
export async function MarketingShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteGraph = buildGraph([
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
  ]);
  const catalogue = await getStorefrontCatalogue();

  return (
    <StorefrontCatalogueProvider catalogue={catalogue}>
      <CartProvider>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="site-shell">
          <AnnouncementBar />
          <SiteHeader
            accountNav={
              <Suspense fallback={<AccountNavFallback />}>
                <AccountNav />
              </Suspense>
            }
          />
          <main id="main-content" className="site-main">
            {children}
          </main>
          <SiteFooter />
        </div>
        <ConversionEvents />
        <GoogleAnalytics />
        <JsonLd data={siteGraph} />
      </CartProvider>
    </StorefrontCatalogueProvider>
  );
}
