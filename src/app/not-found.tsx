import Link from "next/link";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { siteConfig } from "@/lib/site";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.kicker}>404</p>
        <h1>This Page Has Wandered Off</h1>
        <p>
          The page you were looking for does not exist or may have moved.
        </p>
        <div className={styles.actions}>
          <PrimaryButton href={siteConfig.product.path}>
            Shop the Dungarees
          </PrimaryButton>
        </div>
        <ul className={styles.links}>
          <li>
            <Link href="/">Homepage</Link>
          </li>
          <li>
            <Link href="/size-guide/">Size Guide</Link>
          </li>
          <li>
            <Link href="/contact/">Contact</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
