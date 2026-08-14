import type { Metadata } from "next";
import { Suspense } from "react";
import { customerLogoutAction } from "@/app/account/actions";
import { AccountSectionNav } from "@/components/account/AccountSectionNav";
import { AccountWorkspaceSkeleton } from "@/components/account/AccountPrimitives";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { getCustomerSession } from "@/lib/account/customer-dal";
import styles from "./account.module.css";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<AccountWorkspaceSkeleton />}>
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
  const displayName = [session?.firstName, session?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        {session ? (
          <div className={styles.workspace}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarIdentity}>
                <p className={styles.sidebarHeading}>My account</p>
                {displayName ? (
                  <p className={styles.sidebarName}>{displayName}</p>
                ) : null}
                <p className={styles.sidebarEmail}>{session.email}</p>
              </div>
              <AccountSectionNav />
              <form action={customerLogoutAction} className={styles.signOut}>
                <button type="submit" className={styles.signOutButton}>
                  Sign out
                </button>
              </form>
            </aside>
            <div className={styles.content}>{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
