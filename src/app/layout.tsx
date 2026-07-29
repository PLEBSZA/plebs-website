import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { headers } from "next/headers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ConversionEvents } from "@/components/analytics/ConversionEvents";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { CookieConsent } from "@/components/consent/CookieConsent";
import { CartProvider } from "@/components/cart/CartProvider";
import { StorefrontCatalogueProvider } from "@/components/commerce/StorefrontCatalogueProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import { shouldIndexSite, getCanonicalSiteUrl } from "@/lib/env";
import { defaultOgImage } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import {
  buildGraph,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/structured-data";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "600"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const siteUrl = getCanonicalSiteUrl();
const indexable = shouldIndexSite();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PLEBS | 100% Cotton Corduroy Dungarees",
    template: "%s | PLEBS",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Corduroy Dungarees in 100% Cotton | PLEBS",
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "en_ZA",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corduroy Dungarees in 100% Cotton | PLEBS",
    description: siteConfig.description,
    images: [defaultOgImage.url],
  },
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return (
      <html lang="en-ZA" className={`${fraunces.variable} ${sourceSans.variable}`}>
        <body>{children}</body>
      </html>
    );
  }

  const siteGraph = buildGraph([
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
  ]);

  const catalogue = await getStorefrontCatalogue();

  return (
    <html lang="en-ZA" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body>
        <ConsentProvider>
          <StorefrontCatalogueProvider catalogue={catalogue}>
            <CartProvider>
              <a href="#main-content" className="skip-link">
                Skip to content
              </a>
              <div className="site-shell">
                <AnnouncementBar />
                <SiteHeader />
                <main id="main-content" className="site-main">
                  {children}
                </main>
                <SiteFooter />
              </div>
              <ConversionEvents />
              <CookieConsent />
              <JsonLd data={siteGraph} />
            </CartProvider>
          </StorefrontCatalogueProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
