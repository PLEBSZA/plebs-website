import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lifestyleProductImage } from "@/lib/media";
import styles from "./LifestyleSection.module.css";

export function LifestyleSection() {
  return (
    <section className={`section section--cream ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.media}>
          <Image
            src={lifestyleProductImage.src}
            alt={lifestyleProductImage.alt}
            width={lifestyleProductImage.width}
            height={lifestyleProductImage.height}
            className={styles.image}
            sizes="(max-width: 899px) calc(100vw - 2rem), 60vw"
          />
        </div>
        <div className={styles.copy}>
          <SectionHeading title="For People Who Dress Like Themselves" light>
            <p>
              PLEBS is built around clothing with personality—not clothing that
              tells you who to be. Our dungarees are made for creative people,
              practical people, quiet people and loud people. There is no correct
              way to wear them.
            </p>
            <p>
              Layer them, work in them, travel in them or turn up overdressed to
              a picnic beside a waterfall. The point is not to fit a uniform. The
              point is to make the garment yours.
            </p>
            <p>
              <Link href="/about/" className={styles.link}>
                Read why PLEBS started with one product
              </Link>
            </p>
          </SectionHeading>
        </div>
      </div>
    </section>
  );
}
