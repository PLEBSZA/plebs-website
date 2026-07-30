import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./ColourSection.module.css";

export function ColourSection() {
  return (
    <section className={`section section--cream ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <SectionHeading title="Grounded in Green">
          <p>
            The signature PLEBS green is bold without being loud. It sits
            naturally alongside cream, black, white, brown and other earthy
            layers, making the dungarees easy to restyle across seasons.
          </p>
        </SectionHeading>
        <div className={styles.swatches} aria-label="Colour direction">
          <section className={styles.colourStory}>
            <h3>Signature Green</h3>
            <div className={`${styles.swatch} ${styles.forest}`}>
              <span>Forest green</span>
            </div>
          </section>
          <section className={styles.colourStory}>
            <h3>Natural Earth Tones</h3>
            <div className={`${styles.swatch} ${styles.earth}`}>
              <span>Earth tone direction (Coming Soon)</span>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
