import Image from "next/image";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { formatMoney } from "@/lib/money";
import { primaryProductImage } from "@/lib/media";
import { productData } from "@/lib/product";
import { siteConfig } from "@/lib/site";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-heading">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>THE PLEBS ORIGINAL</p>
          <h1 id="hero-heading" className={styles.title}>
            100% Cotton Corduroy Dungarees
          </h1>
          <p className={styles.body}>
            Comfortable, distinctive and made to be worn your way. PLEBS
            dungarees are crafted from 100% cotton corduroy in rich green and
            earth-toned colourways.
          </p>
          <p className={styles.price}>
            {productData.price != null
              ? formatMoney(productData.price)
              : siteConfig.product.priceDisplay}
          </p>
          <div className={styles.actions}>
            <PrimaryButton
              href="/products/cotton-corduroy-dungarees/"
              fullWidth
              eventName="select_item"
            >
              Shop the Dungarees
            </PrimaryButton>
            <SecondaryButton
              href="/size-guide/"
              fullWidth
              eventName="view_size_guide"
            >
              View Fit &amp; Sizing
            </SecondaryButton>
          </div>
        </div>
        <div className={styles.media}>
          <Image
            src={primaryProductImage.src}
            alt={primaryProductImage.alt}
            width={primaryProductImage.width}
            height={primaryProductImage.height}
            className={styles.image}
            sizes="(max-width: 899px) calc(100vw - 2rem), (max-width: 1400px) 54vw, 760px"
            loading="eager"
          />
        </div>
        <p className={styles.trust}>
          Currently available in Size S · Other sizes are out of stock
        </p>
      </div>
    </section>
  );
}
