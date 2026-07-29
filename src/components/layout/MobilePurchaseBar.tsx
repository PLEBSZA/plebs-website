"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import styles from "./MobilePurchaseBar.module.css";

export function MobilePurchaseBar() {
  const [heroPassed, setHeroPassed] = useState(false);
  const [purchaseVisible, setPurchaseVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const purchase = document.getElementById("purchase");
    if (!hero || !purchase) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        setHeroPassed(!entry.isIntersecting);
      },
      { threshold: 0.15 },
    );

    const purchaseObserver = new IntersectionObserver(
      ([entry]) => setPurchaseVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );

    heroObserver.observe(hero);
    purchaseObserver.observe(purchase);

    return () => {
      heroObserver.disconnect();
      purchaseObserver.disconnect();
    };
  }, []);

  const visible = heroPassed && !purchaseVisible;

  return (
    <div
      className={[styles.bar, visible ? styles.visible : ""]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!visible}
    >
      <div className={styles.content}>
        <div>
          <p className={styles.name}>PLEBS Dungarees</p>
          <p className={styles.price}>
            {productData.price != null ? formatMoney(productData.price) : "Price TBC"} · Size S available
          </p>
        </div>
        <Link
          href="/products/cotton-corduroy-dungarees/#purchase"
          className={styles.cta}
          tabIndex={visible ? 0 : -1}
          data-event="select_item"
        >
          View Dungarees
        </Link>
      </div>
    </div>
  );
}
