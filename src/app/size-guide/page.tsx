import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { productData } from "@/lib/product";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildGraph,
} from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "Corduroy Dungarees Size Guide | PLEBS",
  description:
    "Find your PLEBS dungaree size using body measurements, finished garment measurements, model sizing and practical fit guidance.",
  path: "/size-guide/",
  absoluteTitle: true,
});

const sizingFaqs = [
  {
    question: "Are the dungarees unisex?",
    answer:
      "The design is intended for individual styling across different body types, but the formal unisex grading claim still needs verification. Use the measurement tables once they are published.",
  },
  {
    question: "Are they true to size?",
    answer:
      "True-to-size guidance will only be published after fit testing. Compare finished garment measurements with a similar relaxed garment you already own.",
  },
  {
    question: "Can I wear a jersey underneath?",
    answer:
      "The intended fit allows for layering, although the amount of room depends on your measurements, chosen size and the thickness of the layer.",
  },
  {
    question: "What should I do if I am between sizes?",
    answer:
      "Between-size advice will be added after fit testing. Until then, compare both neighbouring sizes in the finished garment table.",
  },
  {
    question: "How much do the straps adjust?",
    answer:
      "Strap design and adjustment range are still to be confirmed and will appear with the final product specifications.",
  },
  {
    question: "Can I exchange the size?",
    answer:
      "Size exchanges will follow the published shipping and returns policy once the exchange window and conditions are confirmed.",
  },
  {
    question: "Will the fit change after washing?",
    answer:
      "Cotton garments can change with heat and moisture. Follow the finished care label and check the care guide for general corduroy guidance.",
  },
] as const;

export default function SizeGuidePage() {
  const structuredData = buildGraph([
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Size Guide", path: "/size-guide/" },
    ]),
    buildFaqPageJsonLd(sizingFaqs),
  ]);

  return (
    <article className="editorial-page">
      <JsonLd data={structuredData} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Size Guide" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Fit guidance</p>
          <h1>Find Your PLEBS Fit</h1>
          <p>
            Dungarees fit differently from ordinary trousers. Use the body
            measurements and finished garment measurements together to select
            the fit you prefer.
          </p>
          <p>
            Do not rely only on the size printed inside another brand’s garment.
          </p>
          <p className="editorial-page__stock-note">
            <strong>Current availability: Size S.</strong> XS, M, L and XL are
            temporarily out of stock.
          </p>
        </header>

        <section>
          <h2>Start With These Three Measurements</h2>
          <ol>
            <li>Chest or bust</li>
            <li>Waist</li>
            <li>Hip</li>
          </ol>
          <p>
            Inseam is a useful fourth measurement when comparing finished
            garment length.
          </p>
        </section>

        <section>
          <h2>Body Measurements</h2>
          <p>
            These help identify a general size range. All values remain TBC
            until the production grading is confirmed.
          </p>
          <div className="editorial-page__table-scroll">
            <table>
              <caption>
                Planned body-measurement chart for PLEBS dungarees
              </caption>
              <thead>
                <tr>
                  <th scope="col">Size</th>
                  <th scope="col">Chest / Bust</th>
                  <th scope="col">Waist</th>
                  <th scope="col">Hip</th>
                  <th scope="col">Availability</th>
                </tr>
              </thead>
              <tbody>
                {productData.sizes.map((size) => (
                  <tr key={size.id}>
                    <th scope="row">{size.name}</th>
                    <td>TBC</td>
                    <td>TBC</td>
                    <td>TBC</td>
                    <td>{size.available ? "In stock" : "Out of stock"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Dungaree Measurements</h2>
          <p>
            Finished garment measurements describe the actual dungarees laid
            flat unless otherwise stated.
          </p>
          <div className="editorial-page__table-scroll">
            <table>
              <caption>
                Planned finished-garment measurement chart for PLEBS dungarees
              </caption>
              <thead>
                <tr>
                  <th scope="col">Size</th>
                  <th scope="col">Bib Width</th>
                  <th scope="col">Waist</th>
                  <th scope="col">Hip</th>
                  <th scope="col">Inseam</th>
                  <th scope="col">Total Length</th>
                  <th scope="col">Availability</th>
                </tr>
              </thead>
              <tbody>
                {productData.sizes.map((size) => (
                  <tr key={size.id}>
                    <th scope="row">{size.name}</th>
                    <td>TBC</td>
                    <td>TBC</td>
                    <td>TBC</td>
                    <td>TBC</td>
                    <td>TBC</td>
                    <td>{size.available ? "In stock" : "Out of stock"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="editorial-page__note">
            Additional dimensions such as rise, leg opening and strap adjustment
            will be added when they are confirmed.
          </p>
        </section>

        <section>
          <h2>How to Measure Yourself</h2>
          <div className="editorial-page__measure-grid">
            <article className="editorial-page__measure-card">
              <h3>Chest or bust</h3>
              <p>
                Measure around the fullest part while keeping the tape level.
              </p>
            </article>
            <article className="editorial-page__measure-card">
              <h3>Waist</h3>
              <p>
                Measure where you expect the dungarees to sit without pulling
                the tape tightly.
              </p>
            </article>
            <article className="editorial-page__measure-card">
              <h3>Hip</h3>
              <p>Measure around the fullest part of the hips and seat.</p>
            </article>
            <article className="editorial-page__measure-card">
              <h3>Inseam</h3>
              <p>
                Measure from the upper inner leg to the desired trouser hem.
              </p>
            </article>
          </div>
          <ImagePlaceholder
            label="How-to-measure diagram for dungarees"
            aspect="landscape"
          />
        </section>

        <section>
          <h2>Compare a Garment You Already Own</h2>
          <p>
            Lay a relaxed pair of trousers or dungarees flat without stretching
            the fabric. Measure from seam to seam and compare those values with
            the finished garment table.
          </p>
          <p>
            This is often more useful than body measurements alone for
            one-piece garments.
          </p>
        </section>

        <section>
          <h2>See the Fit on Different Bodies</h2>
          <p>
            Model references will show height, body measurements, size worn and
            preferred fit once photography and sizing are ready.
          </p>
          <div className="editorial-page__model-grid">
            {[1, 2].map((model) => (
              <article key={model} className="editorial-page__model-card">
                <ImagePlaceholder
                  label={`Model ${model} front and side fit`}
                  aspect="portrait"
                />
                <h3>Model {model}</h3>
                <p>Height: TBC</p>
                <p>Chest / Bust: TBC</p>
                <p>Waist: TBC</p>
                <p>Hip: TBC</p>
                <p>Size worn: TBC</p>
                <p>Preferred fit: TBC</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2>Choose the Fit You Prefer</h2>
          <p>
            Size-up and size-down recommendations will only be published after
            proper fit testing. Until then, use the measurement tables and model
            information as they become available.
          </p>
          <ul>
            <li>Recommended size for the intended relaxed fit — TBC</li>
            <li>Closer fit option — TBC</li>
            <li>Heavier layering option — TBC</li>
          </ul>
        </section>

        <section>
          <h2>Sizing Questions</h2>
          <div className="editorial-page__faqs">
            {sizingFaqs.map((item) => (
              <details key={item.question}>
                <summary data-event="faq_interaction">{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="editorial-page__final">
          <h2>Ready to Choose Your Size?</h2>
          <p>
            Return to the product page once you have compared measurements, or
            contact PLEBS if you need sizing help after support channels are
            live.
          </p>
          <div className="editorial-page__cta">
            <PrimaryButton
              href={siteConfig.product.path}
              eventName="select_item"
            >
              Shop the PLEBS Dungarees
            </PrimaryButton>
          </div>
          <ul className="editorial-page__related">
            <li>
              <Link href="/shipping-returns/" data-event="view_shipping_policy">
                Review size exchange information
              </Link>
            </li>
            <li>
              <Link href="/contact/">Ask a product or sizing question</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
