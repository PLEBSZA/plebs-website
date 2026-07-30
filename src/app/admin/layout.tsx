import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin stays request-time (auth). Suspense lets Cache Components prerender
 * an empty shell while session-backed pages stream — no marketing chrome.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
