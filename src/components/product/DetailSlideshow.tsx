"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import type { ProductImage } from "@/lib/media";
import styles from "./DetailSlideshow.module.css";

const SLIDE_INTERVAL_MS = 4000;

type Props = {
  images: readonly ProductImage[];
  label?: string;
};

export function DetailSlideshow({
  images,
  label = "Construction and texture details",
}: Props) {
  const labelId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] ?? images[0];
  const autoplay = !paused && !reducedMotion && images.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const next = ((index % images.length) + images.length) % images.length;
      setActiveIndex(next);
    },
    [images.length],
  );

  const showPrevious = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const showNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const onPrefersReducedMotion = useEffectEvent((matches: boolean) => {
    setReducedMotion(matches);
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    onPrefersReducedMotion(media.matches);
    const listener = (event: MediaQueryListEvent) => {
      onPrefersReducedMotion(event.matches);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, images.length]);

  if (!activeImage) return null;

  return (
    <div
      ref={regionRef}
      className={styles.slideshow}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!regionRef.current?.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <p id={labelId} className={styles.visuallyHidden}>
        {label}. {images.length} slides. Use previous and next controls to
        change slides.
      </p>

      <div className={styles.frame}>
        {images.map((image, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={image.id}
              className={[styles.slide, isActive ? styles.slideActive : ""]
                .filter(Boolean)
                .join(" ")}
              aria-hidden={!isActive}
            >
              <Image
                src={image.src}
                alt={isActive ? image.alt : ""}
                width={image.width}
                height={image.height}
                className={styles.image}
                style={{ objectPosition: image.objectPosition }}
                sizes="(max-width: 899px) calc(100vw - 2rem), 36vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            onClick={showPrevious}
            aria-label="Previous detail image"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.control}
            onClick={showNext}
            aria-label="Next detail image"
          >
            →
          </button>
        </div>

        <p className={styles.status} aria-live="polite">
          {activeIndex + 1} / {images.length}
        </p>
      </div>

      <p className={styles.caption}>{activeImage.caption}</p>

      <div className={styles.dots} role="tablist" aria-label="Choose detail slide">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Show ${image.caption}`}
            className={[
              styles.dot,
              index === activeIndex ? styles.dotActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  );
}
