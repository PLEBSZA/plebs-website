import { MarketingShell } from "@/components/layout/MarketingShell";

/**
 * Marketing site chrome. Catalogue is Cache Components–cached so this layout
 * can prerender; admin mutations revalidate the `storefront-catalogue` tag.
 *
 * Do not wrap all children in Suspense here — a null fallback becomes a
 * streaming hole and tanks CLS. Dynamic routes (review, confirmation) own
 * their own Suspense boundaries.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MarketingShell>{children}</MarketingShell>;
}
