import styles from "./ProductTrustStrip.module.css";

const defaultItems = [
  "100% Cotton",
  "350 GSM Corduroy",
  "Mid-Wale Texture",
  "Designed for Everyday Wear",
];

type ProductTrustStripProps = {
  items?: string[];
};

export function ProductTrustStrip({
  items = defaultItems,
}: ProductTrustStripProps) {
  return (
    <section
      className={styles.strip}
      aria-label="Product highlights"
    >
      <div className={`container ${styles.inner}`}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item} className={styles.item}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
