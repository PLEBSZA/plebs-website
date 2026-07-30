import { Suspense } from "react";
import { MarketingShell } from "@/components/layout/MarketingShell";

/**
 * Marketing site chrome. Catalogue is Cache Components–cached so this layout
 * can prerender; admin mutations revalidate the `storefront-catalogue` tag.
 * Dynamic page regions (searchParams, etc.) stream inside Suspense for PPR.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MarketingShell>
      <Suspense fallback={null}>{children}</Suspense>
    </MarketingShell>
  );
}
