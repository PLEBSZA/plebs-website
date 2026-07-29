import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cottonCorduroyDungareeImages } from "@/lib/media";
import styles from "./ProductGallery.module.css";

export function ProductGallery() {
  return (
    <section className={`section section--sand ${styles.section}`}>
      <div className="container">
        <SectionHeading title="See the Dungarees From Every Angle">
          <p>
            Campaign, lifestyle and detail views of the Forest Green dungarees.
            Dedicated back and measurement photographs remain part of the next
            photography brief.
          </p>
        </SectionHeading>
        <ul className={styles.grid}>
          {cottonCorduroyDungareeImages.map((image) => (
            <li key={image.id} className={styles.item}>
              <figure>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className={styles.image}
                  sizes="(max-width: 639px) 82vw, (max-width: 999px) 50vw, 33vw"
                />
                <figcaption>{image.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
