import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { corduroyFabric } from "@/lib/sizing";
import styles from "./MaterialSection.module.css";

export function MaterialSection() {
  return (
    <section className={`section section--forest ${styles.section}`}>
      <div className="container">
        <SectionHeading title="Why 100% Cotton Corduroy?" light>
          <p>
            Corduroy is woven with raised vertical ridges known as wales. These
            ridges give the fabric its depth, texture and recognisable
            character.
          </p>
          <p>
            PLEBS uses {corduroyFabric.summary} for its natural feel and
            structured silhouette. The mid-wale rib catches light across the
            garment without printed graphics.
          </p>
        </SectionHeading>
        <div className={styles.points}>
          <section>
            <h3>Natural Feel</h3>
            <p>
              Cotton gives the corduroy a natural-fibre foundation — 100% cotton
              cloth with no elastane — without implying unverified organic or
              sustainability credentials.
            </p>
          </section>
          <section>
            <h3>Distinctive Texture</h3>
            <p>
              Mid-wale ribs catch light across the garment, creating visual depth
              without printed graphics.
            </p>
          </section>
          <section>
            <h3>Repeat Wear</h3>
            <p>
              At 350 GSM the cloth has enough body for everyday restyling. Wash
              gently and hang-dry to keep the ribs looking sharp.
            </p>
          </section>
        </div>
        <Link href="/cotton-corduroy/" className={styles.link}>
          Learn about our cotton corduroy
        </Link>
        <Link href="/care-guide/" className={styles.link} data-event="view_care_guide">
          Read the cotton corduroy care guide
        </Link>
      </div>
    </section>
  );
}
