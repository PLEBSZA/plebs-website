"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV_ITEMS, isAccountNavActive } from "@/lib/account/account-ui";
import styles from "@/app/account/account.module.css";

export function AccountSectionNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.sectionNav} aria-label="Account">
      <ul className={styles.sectionNavList}>
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const active = isAccountNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.sectionNavLink}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
