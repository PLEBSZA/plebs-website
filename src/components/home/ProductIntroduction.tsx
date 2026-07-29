import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import Link from "next/link";
import { editorialProductImage } from "@/lib/media";
import styles from "./ProductIntroduction.module.css";

export function ProductIntroduction() {
  return (
    <section className={`section section--cream ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <Image
          src={editorialProductImage.src}
          alt={editorialProductImage.alt}
          width={editorialProductImage.width}
          height={editorialProductImage.height}
          className={styles.image}
          sizes="(max-width: 899px) calc(100vw - 2rem), 52vw"
        />
        <div className={styles.copy}>
          <SectionHeading title="Corduroy Made to Be Lived In">
            <p>
              PLEBS dungarees are designed for ordinary days, strange adventures
              and everything between them. The structured corduroy gives the
              garment character, while the relaxed shape makes it easy to layer,
              move and wear repeatedly.
            </p>
            <p>
              Made from 100% cotton corduroy at 350 GSM, the design balances
              comfort, practical details and a strong visual identity without
              relying on disposable trends.
            </p>
          </SectionHeading>
          <Link
            href="/products/cotton-corduroy-dungarees/"
            className={styles.link}
            data-event="select_item"
          >
            See the full product details
          </Link>
        </div>
      </div>
    </section>
  );
}
