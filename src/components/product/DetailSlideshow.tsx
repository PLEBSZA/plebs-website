"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ProductImage } from "@/lib/media";
import styles from "./DetailSlideshow.module.css";

const SLIDE_INTERVAL_MS = 4000;
const FADE_MS = 550;

type Props = {
  images: readonly ProductImage[];
  label?: string;
};

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function DetailSlideshow({
  images,
  label = "Construction and texture details",
}: Props) {
  const labelId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [inViewport, setInViewport] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const activeImage = images[activeIndex] ?? images[0];
  const autoplay =
    !paused && !reducedMotion && inViewport && images.length > 1;

  const navigateTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const next = ((index % images.length) + images.length) % images.length;
      setActiveIndex((current) => {
        if (current !== next) {
          setPreviousIndex(current);
        }
        return next;
      });
    },
    [images.length],
  );

  const showPrevious = useCallback(() => {
    navigateTo(activeIndex - 1);
  }, [activeIndex, navigateTo]);

  const showNext = useCallback(() => {
    navigateTo(activeIndex + 1);
  }, [activeIndex, navigateTo]);

  useEffect(() => {
    const node = regionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (previousIndex === null || reducedMotion) return;
    const timer = window.setTimeout(() => setPreviousIndex(null), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [previousIndex, activeIndex, reducedMotion]);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => {
        const next = (index + 1) % images.length;
        setPreviousIndex(index);
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, images.length]);

  if (!activeImage) return null;

  const lookahead =
    images.length > 1 ? (activeIndex + 1) % images.length : null;
  const fadingFrom = reducedMotion ? null : previousIndex;

  const mountedIndexes = new Set<number>([activeIndex]);
  if (lookahead !== null) mountedIndexes.add(lookahead);
  if (fadingFrom !== null) mountedIndexes.add(fadingFrom);

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
        {[...mountedIndexes].map((index) => {
          const image = images[index];
          if (!image) return null;
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
                loading="lazy"
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
            onClick={() => navigateTo(index)}
          />
        ))}
      </div>
    </div>
  );
}
