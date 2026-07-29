"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { siteConfig } from "@/lib/site";
import styles from "./MobileMenu.module.css";

const mobileNav = [
  { href: siteConfig.product.path, label: "Shop the Dungarees" },
  { href: "/about/", label: "Our Story" },
  { href: "/cotton-corduroy/", label: "100% Cotton Corduroy" },
  { href: "/size-guide/", label: "Size Guide" },
  { href: "/care-guide/", label: "Care Guide" },
  { href: "/shipping-returns/", label: "Shipping & Returns" },
  { href: "/contact/", label: "Contact" },
] as const;

type MobileMenuProps = {
  id: string;
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ id, open, onClose }: MobileMenuProps) {
  const { count, openCart } = useCart();

  return (
    <div
      id={id}
      className={[styles.panel, open ? styles.open : ""].filter(Boolean).join(" ")}
      hidden={!open}
    >
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav className={styles.drawer} aria-label="Mobile">
        <button type="button" className={styles.close} onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className="visually-hidden">Close menu</span>
        </button>
        <p className={styles.title}>Explore</p>
        <ul className={styles.list}>
          {mobileNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.link} onClick={onClose}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={styles.cart}
              onClick={() => {
                onClose();
                openCart();
              }}
            >
              Cart ({count})
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
