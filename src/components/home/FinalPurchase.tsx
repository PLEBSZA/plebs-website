import Link from "next/link";
import Image from "next/image";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import { formatMoney } from "@/lib/money";
import { primaryProductImage } from "@/lib/media";
import { siteConfig } from "@/lib/site";
import styles from "./FinalPurchase.module.css";

export async function FinalPurchase() {
  const catalogue = await getStorefrontCatalogue();

  return (
    <section
      id="purchase"
      className={`section ${styles.section}`}
    >
      <div className={`container ${styles.grid}`}>
        <div className={styles.media}>
          <SectionHeading title="Make Them Yours">
            <p>
              One pair of dungarees. No prescribed way to wear them. Choose your
              size and start building the rest around them.
            </p>
          </SectionHeading>
          <Image
            src={primaryProductImage.src}
            alt={primaryProductImage.alt}
            width={primaryProductImage.width}
            height={primaryProductImage.height}
            className={styles.image}
            sizes="(max-width: 899px) calc(100vw - 2rem), 52vw"
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.productMeta}>
            <p className={styles.productName}>{siteConfig.product.name}</p>
            <p className={styles.price}>
              {catalogue.price != null
                ? formatMoney(catalogue.price)
                : siteConfig.product.priceDisplay}
            </p>
            <p className={styles.stock}>
              <span>In stock</span> Size S currently available
            </p>
          </div>

          <PrimaryButton
            href="/products/cotton-corduroy-dungarees/#purchase"
            fullWidth
            eventName="select_item"
          >
            View the Dungarees
          </PrimaryButton>

          <ul className={styles.links}>
            <li>
              <Link href="/size-guide/" data-event="view_size_guide">
                View the PLEBS corduroy dungarees size guide
              </Link>
            </li>
            <li>
              <Link href="/care-guide/">
                Read the cotton corduroy care guide
              </Link>
            </li>
            <li>
              <Link href="/shipping-returns/" data-event="view_shipping_policy">
                Review shipping, exchanges and returns
              </Link>
            </li>
            <li>
              <Link href="/about/">
                Learn why PLEBS started with one product
              </Link>
            </li>
            <li>
              <Link href="/refund-policy/" data-event="view_return_policy">
                Read the refund policy outline
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
