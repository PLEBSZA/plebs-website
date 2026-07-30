"use client";

import Image from "next/image";
import { useState } from "react";
import { cottonCorduroyDungareeImages } from "@/lib/media";
import styles from "./ProductPageGallery.module.css";

export function ProductPageGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = cottonCorduroyDungareeImages[activeIndex];

  function showPrevious() {
    setActiveIndex((index) =>
      index === 0 ? cottonCorduroyDungareeImages.length - 1 : index - 1,
    );
  }

  function showNext() {
    setActiveIndex((index) =>
      index === cottonCorduroyDungareeImages.length - 1 ? 0 : index + 1,
    );
  }

  return (
    <div className={styles.gallery} aria-label="Product image gallery">
      <div className={styles.mainImage}>
        <Image
          key={activeImage.id}
          src={activeImage.src}
          alt={activeImage.alt}
          width={activeImage.width}
          height={activeImage.height}
          className={styles.image}
          style={{ objectPosition: activeImage.objectPosition }}
          sizes="(max-width: 899px) calc(100vw - 2rem), 58vw"
          priority={activeIndex === 0}
        />
        <div className={styles.controls}>
          <button type="button" onClick={showPrevious} aria-label="Previous image">
            ←
          </button>
          <button type="button" onClick={showNext} aria-label="Next image">
            →
          </button>
        </div>
        <p className={styles.count} aria-live="polite">
          Image {activeIndex + 1} of {cottonCorduroyDungareeImages.length}
        </p>
      </div>
      <div className={styles.thumbnails} aria-label="Choose product view">
        {cottonCorduroyDungareeImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={[
              styles.thumbnail,
              index === activeIndex ? styles.activeThumbnail : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${image.caption.toLowerCase()}`}
            data-event="product_gallery_interaction"
            data-event-label={image.id}
          >
            <Image
              src={image.src}
              alt=""
              width={image.width}
              height={image.height}
              className={styles.thumbnailImage}
              sizes="96px"
            />
            <span>{image.caption}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
