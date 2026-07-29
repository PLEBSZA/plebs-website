import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./FitSection.module.css";

export function FitSection() {
  return (
    <section className={`section section--sand ${styles.section}`}>
      <div className="container">
        <SectionHeading title="A Relaxed Fit Without the Guesswork">
          <p>
            Dungarees should feel easy through the body while still holding
            their shape. Use the garment measurements below to compare the fit
            with clothing you already own. The final measurements and relaxed-fit
            claim remain provisional until fit testing is complete.
          </p>
        </SectionHeading>
        <dl className={styles.details}>
          <div>
            <dt>Model height</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Model chest or bust</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Model waist and hip</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Size worn</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Garment inseam</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Bib width</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Hip width</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Leg opening</dt>
            <dd>To be confirmed</dd>
          </div>
          <div>
            <dt>Strap adjustment</dt>
            <dd>To be confirmed</dd>
          </div>
        </dl>
        <PrimaryButton href="/size-guide/" eventName="view_size_guide">
          Open the Full Size Guide
        </PrimaryButton>
      </div>
    </section>
  );
}
