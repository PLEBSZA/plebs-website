import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildGraph,
} from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "How to Care for Corduroy Dungarees | PLEBS",
  description:
    "Learn how to wash, dry, store and care for cotton corduroy dungarees while protecting the fabric’s texture, colour and fit.",
  path: "/care-guide/",
  absoluteTitle: true,
});

const careFaqs = [
  {
    question: "Can corduroy go in the washing machine?",
    answer:
      "Many corduroy garments can be machine washed when the care label permits it. Always follow the label attached to your PLEBS dungarees once production instructions are confirmed.",
  },
  {
    question: "Can corduroy go in a tumble dryer?",
    answer:
      "Only if the care label allows it. Excessive heat can affect cotton fibres, colour and texture, so check the finished garment instructions before tumble drying.",
  },
  {
    question: "Why does corduroy attract lint?",
    answer:
      "The raised ribs can catch fibres from other garments and the surrounding environment. Gentle brushing in the direction of the wale often helps.",
  },
  {
    question: "Does corduroy soften over time?",
    answer:
      "Some corduroy eases with wear, but softening depends on fabric weight, finish and construction. It should not be promised as a guaranteed outcome.",
  },
  {
    question: "How do I stop the ribs from flattening?",
    answer:
      "Avoid unnecessary pressure and heat. Where ironing is permitted, follow a method that protects the textured surface rather than crushing it.",
  },
  {
    question: "Can I dry-clean the dungarees?",
    answer:
      "Dry-cleaning suitability will be confirmed on the finished care label. Do not assume dry cleaning is required or permitted before then.",
  },
  {
    question: "How often should corduroy be washed?",
    answer:
      "Wash when needed rather than on a fixed schedule. Less frequent washing can help preserve colour and texture when the garment remains clean.",
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
            Always follow the care label attached to your PLEBS dungarees. The
            guidance below explains general corduroy care and must not override
            the product-specific label.
          </p>
          <p className="editorial-page__note">
            Final wash temperatures, drying methods and ironing settings will
            match the sewn-in production care label once confirmed.
          </p>
        </header>

        <div className="editorial-page__media">
          <ImagePlaceholder
            label="Corduroy dungarees care and texture detail"
            aspect="wide"
          />
        </div>

        <section>
          <h2>Before You Wash Corduroy</h2>
          <ul>
            <li>Check pockets</li>
            <li>Close fasteners</li>
            <li>Turn the garment inside out where approved</li>
            <li>Separate strong colours</li>
            <li>Check for visible stains</li>
            <li>Follow the care label</li>
          </ul>
        </section>

        <section>
          <h2>How to Wash Cotton Corduroy</h2>
          <p>
            Use the wash temperature and cycle shown on the care label.
            Excessive heat and aggressive washing can affect cotton fibres,
            colour and the raised corduroy texture.
          </p>
          <dl className="editorial-page__specs">
            <div>
              <dt>Wash temperature</dt>
              <dd>Confirm on care label</dd>
            </div>
            <div>
              <dt>Wash cycle</dt>
              <dd>Confirm on care label</dd>
            </div>
            <div>
              <dt>Wash inside out</dt>
              <dd>Confirm on care label</dd>
            </div>
            <div>
              <dt>Wash with similar colours</dt>
              <dd>Confirm on care label</dd>
            </div>
            <div>
              <dt>Bleach</dt>
              <dd>Confirm on care label</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>How to Dry Corduroy</h2>
          <ul>
            <li>Avoid excessive heat unless the label permits it</li>
            <li>Reshape the garment after washing</li>
            <li>Use line or flat drying where approved</li>
            <li>Avoid crushing the pile while damp</li>
            <li>Check the label before tumble drying</li>
          </ul>
        </section>

        <section>
          <h2>Can You Iron Corduroy?</h2>
          <p>
            Direct pressure can flatten corduroy’s raised ribs. Where ironing is
            permitted, follow the care label and use a method that avoids
            crushing the textured surface.
          </p>
          <p className="editorial-page__note">
            Exact heat settings will not be prescribed until production care
            instructions are confirmed.
          </p>
        </section>

        <section>
          <h2>Removing Lint and Surface Marks</h2>
          <ul>
            <li>Use a soft clothes brush</li>
            <li>Brush in the direction of the wale</li>
            <li>Avoid aggressive scraping</li>
            <li>Test any cleaner in an inconspicuous area</li>
            <li>Do not use unapproved stain treatments</li>
          </ul>
        </section>

        <section>
          <h2>How to Store Corduroy Dungarees</h2>
          <ul>
            <li>Clean before long storage</li>
            <li>Ensure the garment is fully dry</li>
            <li>Avoid crushing under heavy garments</li>
            <li>Hang using suitable straps or fold carefully</li>
            <li>Store away from persistent moisture and strong sunlight</li>
          </ul>
        </section>

        <section>
          <h2>Does Cotton Corduroy Shrink?</h2>
          <p>
            Cotton can shrink when exposed to heat and moisture. The amount
            depends on fabric preparation, garment construction and care. Follow
            the PLEBS care label and avoid excessive heat.
          </p>
          <p className="editorial-page__note">
            A verified shrinkage range will be added after production testing.
          </p>
        </section>

        <section>
          <h2>Helping the Colour Last</h2>
          <ul>
            <li>Wash only when needed</li>
            <li>Follow the label temperature</li>
            <li>Wash with similar colours</li>
            <li>Limit strong direct sunlight during drying where relevant</li>
            <li>Avoid unapproved bleaching products</li>
          </ul>
          <p>
            Colour can still change over time. PLEBS will not claim that the
            fabric never fades.
          </p>
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
              <Link href="/contact/">Ask a care or product question</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
