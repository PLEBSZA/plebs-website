import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import type { StorefrontCatalogue } from "@/lib/commerce/storefront-types";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import {
  formatCm,
  garmentMeasurementsBySize,
  modelFitInfo,
  sizeOrder,
  suggestedBodyRangesCm,
  type SizeCode,
} from "@/lib/sizing";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildGraph,
} from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "Corduroy Dungarees Size Guide | PLEBS",
  description:
    "Find your PLEBS dungaree size using finished garment measurements in centimetres, Size S model fit reference and practical layering guidance.",
  path: "/size-guide/",
  absoluteTitle: true,
});

const sizingFaqs = [
  {
    question: "Are the dungarees unisex?",
    answer:
      "The design is made for individual styling across different body types. Use the finished garment measurements in centimetres to choose your size rather than assuming a standard unisex chart.",
  },
  {
    question: "Are they true to size?",
    answer:
      "Compare the finished waist, hip and length measurements with a relaxed garment you already own. Size S is the launch size worn by our models.",
  },
  {
    question: "Can I wear a jersey underneath?",
    answer:
      "Yes — the relaxed silhouette leaves room for layering. Heavier layers may feel better in a larger size; compare hip and thigh widths before sizing up.",
  },
  {
    question: "What should I do if I am between sizes?",
    answer:
      "Choose the smaller size for a closer dungaree fit, or the larger size if you want more ease for layering. Check waist and hip columns first.",
  },
  {
    question: "How much do the straps adjust?",
    answer:
      "Strap length is 40.6 cm and strap width is 2.0 cm across the graded sizes on the size chart. Knotted self-fabric straps allow fit adjustment at the bib.",
  },
  {
    question: "Can I exchange the size?",
    answer:
      "Size exchanges follow the published shipping and returns policy once your order is fulfilled.",
  },
  {
    question: "Will the fit change after washing?",
    answer:
      "100% cotton can shrink with heat. Wash cold or lukewarm on a gentle cycle, hang to dry, and avoid tumble drying to protect the finished size.",
  },
] as const;

function availabilityFor(catalogue: StorefrontCatalogue, size: SizeCode) {
  const match = catalogue.sizes.find((entry) => entry.name === size);
  return match?.available ? "In stock" : "Out of stock";
}

export default async function SizeGuidePage() {
  const catalogue = await getStorefrontCatalogue();
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
            Dungarees fit differently from ordinary trousers. Use the finished
            garment measurements below (in centimetres) to select the fit you
            prefer.
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
            <li>Waist</li>
            <li>Hip</li>
            <li>Preferred total length</li>
          </ol>
          <p>
            Then compare those with the finished garment waist, hips and length
            columns.
          </p>
        </section>

        <section>
          <h2>Suggested Body Ranges</h2>
          <p>
            Approximate body ranges for a relaxed dungaree fit. Use them as a
            starting point alongside the finished garment table.
          </p>
          <div className="editorial-page__table-scroll">
            <table>
              <caption>
                Suggested body ranges for PLEBS cotton corduroy dungarees
              </caption>
              <thead>
                <tr>
                  <th scope="col">Size</th>
                  <th scope="col">Waist (approx.)</th>
                  <th scope="col">Hip (approx.)</th>
                  <th scope="col">Availability</th>
                </tr>
              </thead>
              <tbody>
                {sizeOrder.map((size) => (
                  <tr key={size}>
                    <th scope="row">{size}</th>
                    <td>{suggestedBodyRangesCm[size].waist}</td>
                    <td>{suggestedBodyRangesCm[size].hip}</td>
                    <td>{availabilityFor(catalogue, size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Finished Garment Measurements</h2>
          <p>
            Measurements describe the dungarees. XS and S come from the
            confirmed size chart. M, L and XL are graded from the XS→S
            increments and should be treated as provisional until those sizes
            are physically verified.
          </p>
          <div className="editorial-page__table-scroll">
            <table>
              <caption>
                Finished garment measurements in centimetres for PLEBS dungarees
              </caption>
              <thead>
                <tr>
                  <th scope="col">Size</th>
                  <th scope="col">Waist</th>
                  <th scope="col">Hips</th>
                  <th scope="col">Front bib</th>
                  <th scope="col">Thigh</th>
                  <th scope="col">Leg width</th>
                  <th scope="col">Length</th>
                  <th scope="col">Source</th>
                  <th scope="col">Availability</th>
                </tr>
              </thead>
              <tbody>
                {sizeOrder.map((size) => {
                  const m = garmentMeasurementsBySize[size];
                  return (
                    <tr key={size}>
                      <th scope="row">{size}</th>
                      <td>{formatCm(m.waist)}</td>
                      <td>{formatCm(m.hips)}</td>
                      <td>{formatCm(m.frontBib)}</td>
                      <td>{formatCm(m.thighWidth)}</td>
                      <td>{formatCm(m.legWidth)}</td>
                      <td>{formatCm(m.length)}</td>
                      <td>{m.extrapolated ? "Graded" : "Measured"}</td>
                      <td>{availabilityFor(catalogue, size)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="editorial-page__note">
            Additional detail: strap length {formatCm(garmentMeasurementsBySize.S.strapLength)},
            strap width {formatCm(garmentMeasurementsBySize.S.strapWidth)},
            front/back bib top width matches front bib per size, knee width
            matches thigh width on this chart.
          </p>
        </section>

        <section>
          <h2>How to Measure Yourself</h2>
          <div className="editorial-page__measure-grid">
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
              <h3>Length preference</h3>
              <p>
                Compare total garment length with a favourite one-piece or
                high-rise trouser you already own.
              </p>
            </article>
            <article className="editorial-page__measure-card">
              <h3>Layering room</h3>
              <p>
                If you usually wear thick knits underneath, favour the larger
                neighbouring size when between ranges.
              </p>
            </article>
          </div>
        </section>

        <section>
          <h2>Compare a Garment You Already Own</h2>
          <p>
            Lay a relaxed pair of trousers or dungarees flat without stretching
            the fabric. Measure circumference-equivalent points carefully and
            compare with the waist, hips and length columns above.
          </p>
        </section>

        <section>
          <h2>See the Fit on Models</h2>
          <p>{modelFitInfo.note}</p>
          <div className="editorial-page__model-grid">
            {[1, 2].map((model) => (
              <article key={model} className="editorial-page__model-card">
                <h3>Model {model}</h3>
                <p>{modelFitInfo.genderLabel}</p>
                <p>Height: {modelFitInfo.heightDisplay}</p>
                <p>Weight: {modelFitInfo.weightDisplay}</p>
                <p>Size worn: {modelFitInfo.sizeWorn}</p>
                <p>Fit shown: {modelFitInfo.fitShown}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2>Choose the Fit You Prefer</h2>
          <ul>
            <li>
              Intended relaxed fit: start with the size whose finished waist and
              hip sit closest to a comfortable garment you already own.
            </li>
            <li>
              Closer look: if you prefer less ease, choose the smaller size when
              between ranges.
            </li>
            <li>
              Heavier layering: size up when you regularly wear thick layers
              underneath.
            </li>
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
            contact PLEBS if you need sizing help.
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
            <li>
              <Link href="/care-guide/">Read the care guide</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
