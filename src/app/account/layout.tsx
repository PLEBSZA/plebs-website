import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { customerLogoutAction } from "@/app/account/actions";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { getCustomerSession } from "@/lib/account/customer-dal";
import styles from "./account.module.css";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/account/", label: "Overview" },
  { href: "/account/orders/", label: "Orders" },
  { href: "/account/profile/", label: "Profile" },
  { href: "/account/addresses/", label: "Addresses" },
  { href: "/account/preferences/", label: "Email preferences" },
];

export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={null}>
      <AccountShell>{children}</AccountShell>
    </Suspense>
  );
}

async function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell>
      <AccountFrame>{children}</AccountFrame>
    </MarketingShell>
  );
}

async function AccountFrame({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();

  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        {session ? (
          <>
            <nav className={styles.nav} aria-label="Account">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <form action={customerLogoutAction}>
                <button type="submit" className={styles.secondary}>
                  Sign out
                </button>
              </form>
            </nav>
            {children}
          </>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
