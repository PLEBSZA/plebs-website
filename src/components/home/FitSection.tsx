import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  formatCm,
  garmentMeasurementsBySize,
  modelFitInfo,
} from "@/lib/sizing";
import styles from "./FitSection.module.css";

const sizeS = garmentMeasurementsBySize.S;

export function FitSection() {
  return (
    <section className={`section section--sand ${styles.section}`}>
      <div className="container">
        <SectionHeading title="A Relaxed Fit Without the Guesswork">
          <p>
            Dungarees should feel easy through the body while still holding
            their shape. Use the Size S finished measurements below to compare
            with clothing you already own. Models wear Size S.
          </p>
        </SectionHeading>
        <dl className={styles.details}>
          <div>
            <dt>Model</dt>
            <dd>
              {modelFitInfo.genderLabel}, {modelFitInfo.heightDisplay},{" "}
              {modelFitInfo.weightDisplay}
            </dd>
          </div>
          <div>
            <dt>Size worn</dt>
            <dd>{modelFitInfo.sizeWorn}</dd>
          </div>
          <div>
            <dt>Finished waist (S)</dt>
            <dd>{formatCm(sizeS.waist)}</dd>
          </div>
          <div>
            <dt>Finished hips (S)</dt>
            <dd>{formatCm(sizeS.hips)}</dd>
          </div>
          <div>
            <dt>Total length (S)</dt>
            <dd>{formatCm(sizeS.length)}</dd>
          </div>
          <div>
            <dt>Front bib (S)</dt>
            <dd>{formatCm(sizeS.frontBib)}</dd>
          </div>
          <div>
            <dt>Thigh / leg width (S)</dt>
            <dd>{formatCm(sizeS.thighWidth)}</dd>
          </div>
          <div>
            <dt>Strap length × width</dt>
            <dd>
              {formatCm(sizeS.strapLength)} × {formatCm(sizeS.strapWidth)}
            </dd>
          </div>
        </dl>
        <PrimaryButton href="/size-guide/" eventName="view_size_guide">
          Open the Full Size Guide
        </PrimaryButton>
      </div>
    </section>
  );
}
