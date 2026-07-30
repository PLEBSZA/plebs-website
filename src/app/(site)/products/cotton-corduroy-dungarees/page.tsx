import Link from "next/link";
import Image from "next/image";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { formatMoney } from "@/lib/money";
import { brandMedia, cottonCorduroyDetailImages, primaryProductImage } from "@/lib/media";
import {
  careInstructions,
  corduroyFabric,
  formatCm,
  garmentMeasurementsBySize,
  modelFitInfo,
  sizeOrder,
  suggestedBodyRangesCm,
} from "@/lib/sizing";
import { DetailSlideshow } from "@/components/product/DetailSlideshow";
import { ProductPageGallery } from "@/components/product/ProductPageGallery";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  ProductPurchasePanel,
  ProductPurchaseProvider,
  ProductStickyPurchaseBar,
} from "@/components/product/ProductPurchaseExperience";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildGraph,
  buildProductGroupJsonLd,
} from "@/lib/structured-data";
import { getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import styles from "./page.module.css";

export const metadata = createPageMetadata({
  title: "100% Cotton Corduroy Dungarees | PLEBS",
  description:
    "Shop PLEBS 350 GSM cotton corduroy dungarees. View product details, available colours, sizing, care information and delivery options. Size S is currently available.",
  path: "/products/cotton-corduroy-dungarees/",
  absoluteTitle: true,
  image: {
    url: brandMedia.socialProduct.src,
    width: brandMedia.socialProduct.width,
    height: brandMedia.socialProduct.height,
    alt: brandMedia.socialProduct.alt,
  },
});

const productFaqs = [
  {
    question: "Are the dungarees made from 100% cotton?",
    answer:
      "Yes. The cloth is 100% cotton corduroy at 350 GSM, with no elastane. Metal hardware on the bib is listed separately from the cotton materials.",
  },
  {
    question: "Are the dungarees unisex?",
    answer:
      "They are graded as a relaxed dungaree across XS–XL. Choose from finished garment measurements and the size guide rather than gendered size labels alone.",
  },
  {
    question: "Should I choose my normal size?",
    answer:
      "Start with the size guide and compare the finished garment with a similar relaxed item rather than relying on a usual size alone.",
  },
  {
    question: "Can I wear the dungarees over a jersey?",
    answer:
      "Yes. The relaxed cut and mid-weight 350 GSM corduroy are intended for layering over T-shirts and light knits. Compare thigh and bib measurements if you layer heavily.",
  },
  {
    question: "Does cotton corduroy stretch?",
    answer:
      "No mechanical stretch — the cloth has no elastane. The fabric can ease slightly with wear, which is not the same as stretch.",
  },
  {
    question: "Will the fabric shrink?",
    answer:
      "Cotton may shrink with excessive heat. Wash cold or lukewarm on a gentle cycle and hang to dry — avoid tumble drying.",
  },
  {
    question: "Do the colours look exactly the same in person?",
    answer:
      "Photography aims for accuracy, but screens and lighting can still shift how Forest Green appears.",
  },
  {
    question: "Can I exchange the dungarees if the size is wrong?",
    answer:
      "Size exchanges follow the published Shipping & Returns and Refund Policy pages once your order terms are confirmed at checkout.",
  },
  {
    question: "Where are the dungarees made?",
    answer:
      "The verified country of manufacture will be stated here once confirmed.",
  },
] as const;

const highlights = [
  {
    title: "100% Cotton Corduroy",
    text: "350 GSM mid-wale cotton corduroy with a structured, tactile rib and no elastane.",
  },
  {
    title: "Relaxed Fit",
    text: "Easy through the body for movement and layering, with finished measurements published in the size guide.",
  },
  {
    title: "Practical Construction",
    text: "Side pockets, bib placket with button hardware, and adjustable self-fabric strap ties.",
  },
  {
    title: "Distinctive Colour",
    text: "Signature Forest Green leads the range; an earth tone colourway is listed when available.",
  },
] as const;

const specifications = [
  ["Product type", "Corduroy dungarees"],
  ["Included", "One pair of dungarees"],
  ["Main fabric", corduroyFabric.summary],
  ["Fabric weight", corduroyFabric.weightDisplay],
  ["Wale", corduroyFabric.wale],
  ["Stretch", corduroyFabric.stretch],
  ["Fit", "Relaxed dungaree silhouette"],
  ["Leg shape", "Wide / straight leg (per size chart leg width)"],
  ["Closure", "Self-fabric strap ties at the bib"],
  ["Straps", "Adjustable knotted self-fabric straps (40.6 cm × 2.0 cm)"],
  ["Pockets", "Side pockets with bib front"],
  ["Hardware", "Metal buttons on the bib placket"],
  ["Thread", "Cotton"],
  ["Lining", "Unlined"],
  ["Available colours", "Forest Green (in stock); earth tone when available"],
  ["Available size", "S — in stock"],
  ["Other sizes", "XS, M, L and XL — currently out of stock"],
  ["Product code / SKU", "PLB-D01"],
] as const;

const careDetails = [
  ["Fibre", careInstructions.fibre],
  ["Machine wash", careInstructions.machineWash],
  ["Water temperature", careInstructions.waterTemperature],
  ["Wash cycle", careInstructions.cycle],
  ["Wash inside out", careInstructions.insideOut],
  ["Similar colours", careInstructions.similarColours],
  ["Bleach", careInstructions.bleach],
  ["Drying", careInstructions.drying],
  ["Ironing", careInstructions.ironing],
] as const;

const deliveryDetails = [
  ["Dispatch time", "TBC"],
  ["South African delivery estimate", "TBC"],
  ["International delivery", "Available / not available — confirm"],
  ["Courier provider", "TBC"],
  ["Tracking supplied", "Yes / no — confirm"],
  ["Free-delivery threshold", "TBC"],
  ["Remote-area surcharge", "TBC"],
  ["Duties and taxes", "TBC"],
] as const;

const returnDetails = [
  ["Return window", "TBC"],
  ["Exchange window", "TBC"],
  ["Condition required", "Unworn, unwashed and with original tags — confirm"],
  ["Return shipping responsibility", "TBC"],
  ["Exchange shipping responsibility", "TBC"],
  ["Refund method", "TBC"],
  ["Sale-item policy", "TBC"],
  ["Faulty-item procedure", "TBC"],
  ["International return policy", "TBC"],
] as const;

export default async function ProductPage() {
  const catalogue = await getStorefrontCatalogue();
  const structuredData = buildGraph([
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      {
        name: "Corduroy Dungarees",
        path: "/products/cotton-corduroy-dungarees/",
      },
    ]),
    buildProductGroupJsonLd(catalogue),
    buildFaqPageJsonLd(productFaqs),
  ]);

  return (
    <ProductPurchaseProvider>
      <JsonLd data={structuredData} />
      <article className={styles.page}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Corduroy Dungarees" },
          ]}
        />

        <div className={`container ${styles.heroGrid}`}>
          <ProductPageGallery />

          <div className={styles.summary}>
            <p className={styles.eyebrow}>THE PLEBS ORIGINAL</p>
            <h1>PLEBS 100% Cotton Corduroy Dungarees</h1>
            <p className={styles.price}>{catalogue.price != null ? formatMoney(catalogue.price) : siteConfig.product.priceDisplay}</p>
            <p className={styles.shortDescription}>
              A relaxed one-piece dungaree made from 100% cotton corduroy at
              350 GSM. Designed with practical details, an easy layering fit and
              a strong silhouette in signature PLEBS green.
            </p>
            <p className={styles.accuracyNote}>
              Mid-wale 350 GSM cotton corduroy — structured enough to hold the
              silhouette, soft enough for everyday wear.
            </p>
            <ProductPurchasePanel id="purchase" />
          </div>
        </div>

        <section className={`${styles.section} ${styles.highlightsSection}`}>
          <div className="container">
            <h2 className="visually-hidden">Product Highlights</h2>
            <ul className={styles.highlights}>
              {highlights.map((highlight) => (
                <li key={highlight.title}>
                  <h3>{highlight.title}</h3>
                  <p>{highlight.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <div className={`container ${styles.descriptionGrid}`}>
            <div>
              <p className={styles.kicker}>The PLEBS original</p>
              <h2>Corduroy Dungarees Made to Be Worn Your Way</h2>
            </div>
            <div className={styles.longCopy}>
              <p>
                The PLEBS dungarees combine a relaxed silhouette with the texture
                and structure of cotton corduroy. The garment is intended to feel
                distinctive without becoming difficult to wear, making it suitable
                for everyday outfits, layered styling and more expressive
                combinations.
              </p>
              <p>
                The cloth is 100% cotton corduroy at 350 GSM. Its raised mid-wale
                ribs give the garment depth, while the dungaree construction lets
                the fabric hold its shape without appearing overly formal.
              </p>
              <p>
                Wear the dungarees over a simple T-shirt, add a knit when the
                weather cools, or build the outfit around contrasting textures and
                colours. There is no fixed PLEBS uniform. The design is made to
                become part of your own wardrobe rather than dictate it.
              </p>
              <p className={styles.closingLine}>
                One design. Different people. Different ways of wearing it.
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sand}`}>
          <div className={`container ${styles.editorialGrid}`}>
            <div>
              <h2>Product Details</h2>
              <p>
                Fabric, construction and sizing below reflect the production
                dungarees: 100% cotton corduroy at 350 GSM, with the practical
                details shown across the product photography.
              </p>
              <p className={styles.accuracyNote}>
                Cotton materials cover the cloth and thread. Metal bib hardware
                is listed separately.
              </p>
            </div>
            <dl className={styles.specs}>
              {specifications.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionIntro}>
              <h2>A Relaxed Fit Without the Guesswork</h2>
              <p>
                The PLEBS dungarees are intended to sit comfortably through the
                body while leaving room for movement and layering. Because
                dungarees fit differently from conventional trousers, use garment
                measurements rather than relying only on a usual clothing size.
              </p>
              <p className={styles.accuracyNote}>
                Published Size S measurements and model references support the
                relaxed positioning; M–XL values are graded from the confirmed
                XS→S increment until those sizes are physically re-checked.
              </p>
            </div>

            <div
              className={styles.tableBlock}
              data-view-event="measurement_table_view"
            >
              <h3>Suggested Body Ranges</h3>
              <div className={styles.tableScroll}>
                <table>
                  <caption>
                    Approximate body ranges for a relaxed dungaree fit.
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
                    {sizeOrder.map((size) => {
                      const match = catalogue.sizes.find(
                        (entry) => entry.name === size,
                      );
                      return (
                        <tr key={size}>
                          <th scope="row">{size}</th>
                          <td>{suggestedBodyRangesCm[size].waist}</td>
                          <td>{suggestedBodyRangesCm[size].hip}</td>
                          <td>
                            {match?.available ? "In stock" : "Out of stock"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              className={styles.tableBlock}
              data-view-event="measurement_table_view"
            >
              <h3>Finished Garment Measurements</h3>
              <div className={styles.tableScroll}>
                <table>
                  <caption>
                    Finished garment measurements in centimetres. XS and S are
                    from the size chart; M–XL are graded from the XS→S
                    increments.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Size</th>
                      <th scope="col">Front bib</th>
                      <th scope="col">Waist</th>
                      <th scope="col">Hips</th>
                      <th scope="col">Thigh</th>
                      <th scope="col">Leg width</th>
                      <th scope="col">Total length</th>
                      <th scope="col">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeOrder.map((size) => {
                      const m = garmentMeasurementsBySize[size];
                      const match = catalogue.sizes.find(
                        (entry) => entry.name === size,
                      );
                      return (
                        <tr key={size}>
                          <th scope="row">{size}</th>
                          <td>{formatCm(m.frontBib)}</td>
                          <td>{formatCm(m.waist)}</td>
                          <td>{formatCm(m.hips)}</td>
                          <td>{formatCm(m.thighWidth)}</td>
                          <td>{formatCm(m.legWidth)}</td>
                          <td>{formatCm(m.length)}</td>
                          <td>
                            {match?.available ? "In stock" : "Out of stock"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className={styles.tableNote}>
                Strap length {formatCm(garmentMeasurementsBySize.S.strapLength)}{" "}
                × width {formatCm(garmentMeasurementsBySize.S.strapWidth)} across
                sizes. Graded M–XL values should be confirmed when those sizes
                return to stock.
              </p>
            </div>

            <div className={styles.measureGrid}>
              <div>
                <h3>How to Measure for Your PLEBS Dungarees</h3>
                <dl className={styles.measureList}>
                  <div>
                    <dt>Waist</dt>
                    <dd>
                      Measure where you expect the dungarees to sit without
                      pulling the tape tightly.
                    </dd>
                  </div>
                  <div>
                    <dt>Hip</dt>
                    <dd>
                      Measure around the fullest part of the hips and seat.
                    </dd>
                  </div>
                  <div>
                    <dt>Length preference</dt>
                    <dd>
                      Compare total garment length with a favourite one-piece or
                      high-rise trouser you already own.
                    </dd>
                  </div>
                  <div>
                    <dt>Compare a garment</dt>
                    <dd>
                      Lay a similar relaxed garment flat and compare it with the
                      finished-garment table.
                    </dd>
                  </div>
                </dl>
              </div>
              <div data-view-event="model_fit_information_view">
                <h3>Model Fit Information</h3>
                <p className={styles.tableNote}>{modelFitInfo.note}</p>
                <div className={styles.modelCards}>
                  {[1, 2].map((model) => (
                    <article key={model}>
                      <h4>Model {model}</h4>
                      <p>{modelFitInfo.genderLabel}</p>
                      <p>Height: {modelFitInfo.heightDisplay}</p>
                      <p>Weight: {modelFitInfo.weightDisplay}</p>
                      <p>Wearing: Size {modelFitInfo.sizeWorn}</p>
                      <p>Fit shown: {modelFitInfo.fitShown}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/size-guide/"
              className={styles.textLink}
              data-event="view_size_guide"
            >
              Open the complete PLEBS size guide
            </Link>
          </div>
        </section>

        <section className={`${styles.section} ${styles.forest}`}>
          <div className={`container ${styles.fabricGrid}`}>
            <DetailSlideshow
              images={cottonCorduroyDetailImages}
              label="Cotton corduroy texture and construction details"
            />
            <div>
              <h2>The Feel of Cotton Corduroy</h2>
              <p>
                Corduroy is constructed with raised ribs that run vertically
                through the fabric. These ribs create the recognisable texture and
                allow the garment to catch light differently across its surface.
              </p>
              <p>{corduroyFabric.handFeel}</p>
              <dl className={styles.fabricTbc}>
                <div>
                  <dt>Fibre</dt>
                  <dd>100% cotton corduroy</dd>
                </div>
                <div>
                  <dt>Fabric weight</dt>
                  <dd>{corduroyFabric.weightDisplay}</dd>
                </div>
                <div>
                  <dt>Wale</dt>
                  <dd>{corduroyFabric.wale}</dd>
                </div>
                <div>
                  <dt>Stretch</dt>
                  <dd>{corduroyFabric.stretch}</dd>
                </div>
                <div>
                  <dt>Wash</dt>
                  <dd>Cold or lukewarm, gentle cycle, inside out</dd>
                </div>
                <div>
                  <dt>Dry</dt>
                  <dd>Hang / air-dry — avoid tumble drying</dd>
                </div>
                <div>
                  <dt>Expected shrinkage</dt>
                  <dd>
                    Possible with heat; hang-dry to protect finished size
                  </dd>
                </div>
              </dl>
              <Link href="/cotton-corduroy/" className={styles.textLink}>
                Learn more about 100% cotton corduroy
              </Link>
            </div>
          </div>
          <div className={`container ${styles.materialBenefits}`}>
            <section>
              <h3>Natural Fibre Feel</h3>
              <p>
                100% cotton corduroy — not a polyester-based cloth — with a
                natural hand at 350 GSM.
              </p>
            </section>
            <section>
              <h3>Textured Structure</h3>
              <p>
                Mid-wale ribs create depth and the distinctive corduroy
                appearance across the silhouette.
              </p>
            </section>
            <section>
              <h3>Designed for Layering</h3>
              <p>
                The relaxed dungaree format works over T-shirts and light knits
                as the weather changes.
              </p>
            </section>
            <section>
              <h3>Made for Repeat Wear</h3>
              <p>
                Mid-weight cotton corduroy is chosen for everyday restyling —
                wash gently and hang-dry to keep the ribs looking sharp.
              </p>
            </section>
          </div>
        </section>

        <section className={styles.section}>
          <div className={`container ${styles.editorialGrid}`}>
            <div>
              <h2>How to Care for Your Corduroy Dungarees</h2>
              <p>
                Follow the care label attached to the garment. Cotton corduroy
                should be washed gently and hang-dried to preserve colour,
                ribbed texture and size.
              </p>
              <p className={styles.accuracyNote}>
                Instructions match the PLEBS 100% cotton care label artwork.
              </p>
              <Link
                href="/care-guide/"
                className={styles.textLink}
                data-event="view_care_guide"
              >
                Read the full cotton corduroy care guide
              </Link>
            </div>
            <dl className={styles.specs}>
              {careDetails.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sand}`}>
          <div className={`container ${styles.policyGrid}`}>
            <article>
              <h2>Delivery Information</h2>
              <p>
                Dispatch timing, delivery estimates and tracking cannot be
                promised until the fulfilment setup is confirmed.
              </p>
              <dl className={styles.policyList}>
                {deliveryDetails.map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/shipping-returns/"
                className={styles.textLink}
                data-event="view_shipping_policy"
              >
                View shipping information
              </Link>
            </article>
            <article>
              <h2>Size Exchanges and Returns</h2>
              <p>
                Final policy copy must be reviewed against South African
                consumer-protection requirements before launch.
              </p>
              <dl className={styles.policyList}>
                {returnDetails.map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/refund-policy/"
                className={styles.textLink}
                data-event="view_return_policy"
              >
                View the refund policy
              </Link>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2>Questions About the PLEBS Dungarees</h2>
            <div className={styles.faqs}>
              {productFaqs.map((item) => (
                <details key={item.question}>
                  <summary data-event="faq_interaction">{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.brandSection}`}>
          <div className="container">
            <h2>Made by PLEBS. Worn Your Way.</h2>
            <p>
              PLEBS is focused on a single corduroy design rather than a large
              catalogue of disposable options. This product page shows the
              garment clearly, explains the fit honestly and gives customers the
              information needed to choose with confidence.
            </p>
            <p>
              As the brand grows, new products should be introduced because they
              strengthen the range—not merely to make the website look larger.
            </p>
            <Link href="/about/" className={styles.textLink}>
              Read the full PLEBS story
            </Link>
          </div>
        </section>

        <section className={`${styles.section} ${styles.finalPurchase}`}>
          <div className={`container ${styles.finalGrid}`}>
            <div>
              <h2>Choose Your PLEBS Fit</h2>
              <p>
                Select your colour and size, review the delivery details and make
                the dungarees your own.
              </p>
              <Image
                src={primaryProductImage.src}
                alt={primaryProductImage.alt}
                width={primaryProductImage.width}
                height={primaryProductImage.height}
                className={styles.finalImage}
                sizes="(max-width: 899px) calc(100vw - 2rem), 42vw"
              />
            </div>
            <div>
              <p className={styles.finalName}>{siteConfig.product.name}</p>
              <p className={styles.price}>{catalogue.price != null ? formatMoney(catalogue.price) : siteConfig.product.priceDisplay}</p>
              <ProductPurchasePanel id="final-purchase" compact />
            </div>
          </div>
        </section>
      </article>
      <ProductStickyPurchaseBar />
    </ProductPurchaseProvider>
  );
}
