import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { shouldIndexSite, getCanonicalSiteUrl } from "@/lib/env";
import { defaultOgImage } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
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
      <body>{children}</body>
    </html>
  );
}
