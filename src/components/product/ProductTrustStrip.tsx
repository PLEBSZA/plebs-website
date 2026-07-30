"use client";

import { useEffect, useRef } from "react";
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
  const trackRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const firstGroup = firstGroupRef.current;
    if (!track || !firstGroup) return;

    // CSS reference units define 1 cm as 96 / 2.54 pixels.
    const pixelsPerSecond = (2 * 96) / 2.54;

    const updateMotion = () => {
      const distance = firstGroup.getBoundingClientRect().width;
      track.style.setProperty("--marquee-distance", `${distance}px`);
      track.style.setProperty(
        "--marquee-duration",
        `${distance / pixelsPerSecond}s`,
      );
    };

    updateMotion();
    const observer = new ResizeObserver(updateMotion);
    observer.observe(firstGroup);

    return () => observer.disconnect();
  }, [items]);

  const renderItems = (duplicate = false) =>
    items.map((item) => (
      <li key={`${duplicate ? "duplicate-" : ""}${item}`} className={styles.item}>
        {item}
      </li>
    ));

  return (
    <section className={styles.strip} aria-label="Product highlights">
      <div className={styles.viewport}>
        <div ref={trackRef} className={styles.track}>
          <ul ref={firstGroupRef} className={styles.list}>
            {renderItems()}
          </ul>
          <ul className={styles.list} aria-hidden="true">
            {renderItems(true)}
          </ul>
        </div>
      </div>
    </section>
  );
}
