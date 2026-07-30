"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLUListElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLUListElement>(null);
  const [repeatCount, setRepeatCount] = useState(1);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const probe = probeRef.current;
    if (!viewport || !probe) return;

    const updateRepeats = () => {
      const cycleWidth = probe.getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      if (cycleWidth <= 0 || viewportWidth <= 0) return;

      // One animated group must be wider than the viewport, otherwise the
      // forest-green strip shows empty space before the loop wraps.
      setRepeatCount(Math.max(1, Math.ceil(viewportWidth / cycleWidth) + 1));
    };

    updateRepeats();
    const observer = new ResizeObserver(updateRepeats);
    observer.observe(viewport);
    observer.observe(probe);
    return () => observer.disconnect();
  }, [items]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const group = groupRef.current;
    if (!track || !group) return;

    // CSS reference units define 1 cm as 96 / 2.54 pixels.
    const pixelsPerSecond = (2 * 96) / 2.54;

    const updateMotion = () => {
      const distance = group.getBoundingClientRect().width;
      if (distance <= 0) return;
      track.style.setProperty("--marquee-distance", `${distance}px`);
      track.style.setProperty(
        "--marquee-duration",
        `${distance / pixelsPerSecond}s`,
      );
    };

    updateMotion();
    const observer = new ResizeObserver(updateMotion);
    observer.observe(group);
    return () => observer.disconnect();
  }, [items, repeatCount]);

  const segment = useMemo(
    () => Array.from({ length: repeatCount }, () => items).flat(),
    [items, repeatCount],
  );

  const renderItems = (list: string[], keyPrefix: string) =>
    list.map((item, index) => (
      <li key={`${keyPrefix}-${index}-${item}`} className={styles.item}>
        {item}
      </li>
    ));

  return (
    <section className={styles.strip} aria-label="Product highlights">
      <ul ref={probeRef} className={styles.probe} aria-hidden="true">
        {renderItems(items, "probe")}
      </ul>
      <div ref={viewportRef} className={styles.viewport}>
        <div ref={trackRef} className={styles.track}>
          <ul ref={groupRef} className={styles.list}>
            {renderItems(segment, "a")}
          </ul>
          <ul className={styles.list} aria-hidden="true">
            {renderItems(segment, "b")}
          </ul>
        </div>
      </div>
    </section>
  );
}
