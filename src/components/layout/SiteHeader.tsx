"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { PlebsLogo } from "@/components/brand/PlebsLogo";
import { siteConfig } from "@/lib/site";
import { useCart } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.css";
import type { ReactNode } from "react";

export function SiteHeader({
  accountNav,
  mobileAccountNav,
}: {
  accountNav?: ReactNode;
  mobileAccountNav?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const { count, open: cartOpen, openCart } = useCart();

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="visually-hidden">
            {menuOpen ? "Close menu" : "Open menu"}
          </span>
          <span className={styles.menuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <Link href="/" className={styles.brand} aria-label="PLEBS home">
          <PlebsLogo className={styles.brandMark} />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.navList}>
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.headerActions}>
          <span className={styles.headerAccount}>{accountNav}</span>
          <button
            type="button"
            className={styles.cartButton}
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            aria-expanded={cartOpen}
            aria-controls="cart-drawer"
            onClick={openCart}
            data-event="view_cart"
          >
            Cart
            <span className={styles.cartCount}>
              <span className="visually-hidden">Items in cart: </span>
              {count}
            </span>
          </button>
        </div>
      </div>

      <MobileMenu
        id={menuId}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        accountNav={mobileAccountNav}
      />
      <CartDrawer />
    </header>
  );
}
