import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./ProofSection.module.css";

export function ProofSection() {
  return (
    <section className={`section section--cream ${styles.section}`}>
      <div className="container">
        <SectionHeading title="Product Testing and Refinement">
          <p>
            This section is reserved for factual pattern development, fit tests,
            fabric swatches and prototype comparisons once those records are
            available. Genuine customer feedback can follow after launch.
          </p>
        </SectionHeading>
        <p className={styles.note}>
          “Designed, Tested and Refined” will replace this heading only when the
          product-development process can substantiate it.
        </p>
      </div>
    </section>
  );
}
