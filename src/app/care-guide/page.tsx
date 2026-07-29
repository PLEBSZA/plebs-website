import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { careInstructions } from "@/lib/sizing";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildGraph,
} from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "How to Care for Corduroy Dungarees | PLEBS",
  description:
    "Wash, dry and iron PLEBS 100% cotton corduroy dungarees using the official care label: cold or lukewarm gentle wash, hang dry, no bleach.",
  path: "/care-guide/",
  absoluteTitle: true,
});

const careFaqs = [
  {
    question: "Can corduroy go in the washing machine?",
    answer:
      "Yes. PLEBS cotton corduroy dungarees are machine-washable. Use cold or lukewarm water on a gentle cycle and turn the garment inside out first.",
  },
  {
    question: "Can corduroy go in a tumble dryer?",
    answer:
      "Avoid tumble drying. Hang to dry or air-dry instead — machine heat can shrink cotton and flatten the corduroy ribs.",
  },
  {
    question: "Why does corduroy attract lint?",
    answer:
      "The raised ribs can catch fibres from other garments and the surrounding environment. Gentle brushing in the direction of the wale often helps.",
  },
  {
    question: "Does corduroy soften over time?",
    answer:
      "350 GSM cotton corduroy often eases with wear, but softening depends on how you wash and wear it. It is not guaranteed.",
  },
  {
    question: "How do I stop the ribs from flattening?",
    answer:
      "Turn garments inside out to wash, hang dry, and iron only on the reverse side with low heat — never press directly onto the ribs.",
  },
  {
    question: "Can I dry-clean the dungarees?",
    answer:
      "The sewn-in care guidance focuses on home laundering. Dry cleaning is not required for routine care of this 100% cotton corduroy.",
  },
  {
    question: "How often should corduroy be washed?",
    answer:
      "Wash when needed rather than on a fixed schedule. Less frequent washing helps preserve colour and texture when the garment remains clean.",
  },
] as const;

export default function CareGuidePage() {
  const structuredData = buildGraph([
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Care Guide", path: "/care-guide/" },
    ]),
    buildFaqPageJsonLd(careFaqs),
  ]);

  return (
    <article className="editorial-page">
      <JsonLd data={structuredData} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Care Guide" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Garment care</p>
          <h1>How to Care for Cotton Corduroy Dungarees</h1>
          <p>
            Follow the PLEBS care label on your dungarees. The guidance below
            matches the label artwork for our 350 GSM 100% cotton corduroy
            garments.
          </p>
        </header>

        <section>
          <h2>Fibre content</h2>
          <p>
            <strong>{careInstructions.fibre}</strong> at{" "}
            <strong>350 GSM</strong>. No elastane is declared on the care label,
            so treat the fabric as non-stretch cotton with a mid-wale textured
            surface.
          </p>
          <ul>
            {careInstructions.materialNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Before You Wash Corduroy</h2>
          <ul>
            <li>Check pockets</li>
            <li>Close fasteners where present</li>
            <li>Turn the garment inside out</li>
            <li>Wash with similar colours</li>
            <li>Check for visible stains</li>
            <li>Follow the care label</li>
          </ul>
        </section>

        <section>
          <h2>How to Wash Cotton Corduroy</h2>
          <p>
            Machine wash is approved. Cold or lukewarm water and a gentle cycle
            protect colour and the raised corduroy texture.
          </p>
          <dl className="editorial-page__specs">
            <div>
              <dt>Machine wash</dt>
              <dd>{careInstructions.machineWash}</dd>
            </div>
            <div>
              <dt>Water temperature</dt>
              <dd>{careInstructions.waterTemperature}</dd>
            </div>
            <div>
              <dt>Wash cycle</dt>
              <dd>{careInstructions.cycle}</dd>
            </div>
            <div>
              <dt>Wash inside out</dt>
              <dd>{careInstructions.insideOut}</dd>
            </div>
            <div>
              <dt>Similar colours</dt>
              <dd>{careInstructions.similarColours}</dd>
            </div>
            <div>
              <dt>Bleach</dt>
              <dd>{careInstructions.bleach}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>How to Dry Corduroy</h2>
          <ul>
            <li>{careInstructions.drying}</li>
            <li>Reshape the garment after washing</li>
            <li>Avoid crushing the pile while damp</li>
            <li>Keep drying away from strong direct heat sources</li>
          </ul>
        </section>

        <section>
          <h2>Can You Iron Corduroy?</h2>
          <p>{careInstructions.ironing}</p>
        </section>

        <section>
          <h2>Removing Lint and Surface Marks</h2>
          <ul>
            <li>Use a soft clothes brush</li>
            <li>Brush in the direction of the wale</li>
            <li>Avoid aggressive scraping</li>
            <li>Test any cleaner in an inconspicuous area</li>
            <li>Do not use bleach-based stain treatments</li>
          </ul>
        </section>

        <section>
          <h2>How to Store Corduroy Dungarees</h2>
          <ul>
            <li>Clean before long storage</li>
            <li>Ensure the garment is fully dry</li>
            <li>Avoid crushing under heavy garments</li>
            <li>Hang using the straps or fold carefully</li>
            <li>Store away from persistent moisture and strong sunlight</li>
          </ul>
        </section>

        <section>
          <h2>Does Cotton Corduroy Shrink?</h2>
          <p>
            Cotton can shrink when exposed to heat and moisture. Hang-drying and
            cooler washing — as on the PLEBS label — are the best protection for
            finished size, colour and the 350 GSM mid-wale ribs.
          </p>
        </section>

        <section>
          <h2>Helping the Colour Last</h2>
          <ul>
            <li>Wash only when needed</li>
            <li>Use cold or lukewarm water</li>
            <li>Wash with similar colours</li>
            <li>Limit strong direct sunlight during drying</li>
            <li>Never use bleach</li>
          </ul>
        </section>

        <section>
          <h2>Care Questions</h2>
          <div className="editorial-page__faqs">
            {careFaqs.map((item) => (
              <details key={item.question}>
                <summary data-event="faq_interaction">{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="editorial-page__final">
          <h2>Made to Be Worn, Not Saved for Later</h2>
          <p>
            Good care keeps the dungarees ready for everyday use. Continue to
            the product page or read more about the fabric itself.
          </p>
          <div className="editorial-page__cta">
            <PrimaryButton
              href={siteConfig.product.path}
              eventName="select_item"
            >
              Shop the Cotton Corduroy Dungarees
            </PrimaryButton>
          </div>
          <ul className="editorial-page__related">
            <li>
              <Link href="/cotton-corduroy/">
                Learn more about 100% cotton corduroy
              </Link>
            </li>
            <li>
              <Link href="/size-guide/">Open the size guide</Link>
            </li>
            <li>
              <Link href="/contact/">Ask a care or product question</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
