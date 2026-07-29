import { SectionHeading } from "@/components/ui/SectionHeading";
import { DetailSlideshow } from "@/components/product/DetailSlideshow";
import { cottonCorduroyDetailImages } from "@/lib/media";
import styles from "./ProductFeatures.module.css";

const features = [
  {
    title: "100% Cotton Corduroy",
    description:
      "350 GSM mid-wale cotton corduroy. Care label confirms 100% cotton with no elastane.",
  },
  {
    title: "Relaxed Layering Fit",
    description:
      "Finished Size S waist is 86.0 cm and hips 101.0 cm. Models (1.65 m / 65 kg) wear Size S.",
  },
  {
    title: "Practical Pockets",
    description:
      "Side pockets and bib construction are shown in the detail photographs.",
  },
  {
    title: "Adjustable Fit",
    description:
      "Self-fabric strap ties at the bib. Strap length 40.6 cm and width 2.0 cm across the size chart.",
  },
];

export function ProductFeatures() {
  return (
    <section className={`section section--sand ${styles.section}`}>
      <div className="container">
        <SectionHeading title="The Details That Make the Difference">
          <p>
            Close-ups of the Forest Green 350 GSM corduroy, pockets, bib and
            fastening — the construction details that define the PLEBS dungarees.
          </p>
        </SectionHeading>
        <div className={styles.showcase}>
          <div className={styles.media}>
            <DetailSlideshow
              images={cottonCorduroyDetailImages}
              label="Corduroy texture and construction details"
            />
          </div>
          <ol className={styles.list}>
            {features.map((feature, index) => (
              <li key={feature.title} className={styles.item}>
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={styles.title}>{feature.title}</h3>
                  <p className={styles.description}>{feature.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
