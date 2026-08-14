import type { Metadata } from "next";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { shouldIndexSite, getCanonicalSiteUrl } from "@/lib/env";
import { defaultOgImage } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// Self-hosted so `next build` does not fetch Google Fonts. Turbopack currently
// requests Fraunces woff2 URLs that fonts.gstatic.com 404s, which fails Vercel.
const fraunces = localFont({
  src: "./fonts/Fraunces-latin.woff2",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
  fallback: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

const sourceSans = localFont({
  src: "./fonts/SourceSans3-latin.woff2",
  variable: "--font-source-sans",
  display: "swap",
  weight: "200 900",
  fallback: ["Segoe UI", "sans-serif"],
  adjustFontFallback: "Arial",
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

/**
 * Root layout: fonts + shell only. No Dynamic APIs, no data fetching.
 * Marketing chrome lives in `(site)/layout.tsx`; admin keeps its own layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
