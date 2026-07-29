import { SectionHeading } from "@/components/ui/SectionHeading";
import { DetailSlideshow } from "@/components/product/DetailSlideshow";
import { cottonCorduroyDetailImages } from "@/lib/media";
import styles from "./ProductFeatures.module.css";

const features = [
  {
    title: "100% Cotton Corduroy",
    description:
      "Natural cotton corduroy with a tactile ribbed surface. Exact wale and fabric weight are still to be confirmed.",
  },
  {
    title: "Relaxed Layering Fit",
    description:
      "The intended shape is designed for layering. Final fit language awaits production grading and fit tests.",
  },
  {
    title: "Practical Pockets",
    description:
      "Side pockets and bib construction are shown in the detail photographs. Final pocket count and placement wording will follow production sign-off.",
  },
  {
    title: "Adjustable Fit",
    description:
      "Strap fastening is shown with self-fabric ties on current samples. Hardware and final adjustment details remain provisional until the production specification is locked.",
  },
];

export function ProductFeatures() {
  return (
    <section className={`section section--sand ${styles.section}`}>
      <div className="container">
        <SectionHeading title="The Details That Make the Difference">
          <p>
            Close-ups of the Forest Green corduroy, pockets, bib and fastening.
            Confirmed material is called out clearly; construction notes that
            still need sign-off stay provisional.
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
