import Link from "next/link";
import { PlebsLogo } from "@/components/brand/PlebsLogo";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { siteConfig } from "@/lib/site";
import styles from "./SiteFooter.module.css";

const footerGroups = [
  {
    title: "Shop",
    links: [
      { href: "/products/cotton-corduroy-dungarees/", label: "The Dungarees" },
      { href: "/size-guide/", label: "Size Guide" },
      { href: "/care-guide/", label: "Care Guide" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about/", label: "Our Story" },
      { href: "/cotton-corduroy/", label: "Cotton Corduroy" },
      { href: "/contact/", label: "Contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/shipping-returns/", label: "Shipping & Returns" },
      { href: "/#faq", label: "Frequently Asked Questions" },
      { href: "/contact/", label: "Order Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy/", label: "Privacy Policy" },
      { href: "/terms/", label: "Terms & Conditions" },
      { href: "/refund-policy/", label: "Refund Policy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandBlock}>
          <PlebsLogo className={styles.brand} decorative={false} />
          <p className={styles.tagline}>
            One design. Different people. Worn your way.
          </p>
        </div>

        <nav className={styles.nav} aria-label="Footer">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className={styles.navTitle}>{group.title}</p>
              <ul className={styles.list}>
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}-${link.label}`}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
                {group.title === "Legal" ? (
                  <li>
                    <CookieSettingsButton />
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.newsletter}>
          <NewsletterForm />
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
