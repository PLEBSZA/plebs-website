import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { corduroyFabric } from "@/lib/sizing";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildGraph,
} from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "What Is 100% Cotton Corduroy? | PLEBS",
  description:
    "Learn how cotton corduroy is made, what gives it its ribbed texture, how 350 GSM cotton corduroy feels and why PLEBS uses it for its signature dungarees.",
  path: "/cotton-corduroy/",
  absoluteTitle: true,
});

const materialFaqs = [
  {
    question: "Is corduroy always made from cotton?",
    answer:
      "No. Corduroy can be made from cotton, polyester, blends or other fibres. PLEBS uses 100% cotton corduroy at 350 GSM.",
  },
  {
    question: "Does cotton corduroy stretch?",
    answer:
      "PLEBS cloth has no elastane, so there is no mechanical stretch. The fabric may ease slightly with wear, which is different from stretch.",
  },
  {
    question: "Is corduroy suitable for warm weather?",
    answer:
      "At 350 GSM the cloth is mid-weight: comfortable for mild days with a light top underneath, and substantial enough when the air cools. Very hot, humid days may call for lighter layers.",
  },
  {
    question: "Does corduroy shrink?",
    answer:
      "Cotton can shrink with excess heat and moisture. Follow the PLEBS care label: cold or lukewarm gentle wash and hang dry.",
  },
  {
    question: "How do you wash corduroy?",
    answer:
      "Use the wash method on the garment care label. The PLEBS care guide covers the full routine for this 350 GSM cotton corduroy.",
  },
  {
    question: "What does wale mean?",
    answer:
      "Wale refers to the raised vertical rib that gives corduroy its distinctive texture. PLEBS uses a mid-wale rib — visible texture without an extreme wide-cord look.",
  },
  {
    question: "Is corduroy the same as velvet?",
    answer:
      "No. Both can have a pile surface, but corduroy is defined by its vertical ribs, while velvet usually presents a smoother, continuous pile.",
  },
  {
    question: "Does corduroy soften with wear?",
    answer:
      "Mid-weight cotton corduroy often eases with wear. Softening varies with wash habits and how often the garment is worn — it is not guaranteed.",
  },
] as const;

export default function CottonCorduroyPage() {
  const structuredData = buildGraph([
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Cotton Corduroy", path: "/cotton-corduroy/" },
    ]),
    {
      "@type": "WebPage",
      "@id": absoluteUrl("/cotton-corduroy/#webpage"),
      url: absoluteUrl("/cotton-corduroy/"),
      name: "What Is 100% Cotton Corduroy?",
      description:
        "Learn how cotton corduroy is made, what gives it its ribbed texture, how 350 GSM cotton corduroy feels and why PLEBS uses it for its signature dungarees.",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    },
    buildFaqPageJsonLd(materialFaqs),
  ]);

  return (
    <article className="editorial-page">
      <JsonLd data={structuredData} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cotton Corduroy" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Material guide</p>
          <h1>What Is 100% Cotton Corduroy?</h1>
          <p>
            Corduroy is a woven fabric recognised by its raised vertical ribs.
            These ribs are commonly known as wales and create the texture that
            distinguishes corduroy from smooth cotton fabrics.
          </p>
          <p>
            In 100% cotton corduroy, the cloth is cotton rather than a
            cotton-synthetic blend. PLEBS dungarees use a 350 GSM mid-wale
            cotton corduroy with no elastane.
          </p>
        </header>

        <div className="editorial-page__media">
          <ImagePlaceholder
            label="Cotton corduroy texture close-up"
            aspect="wide"
          />
        </div>

        <section>
          <h2>How Corduroy Gets Its Texture</h2>
          <p>
            Corduroy begins as a woven cloth with extra yarns that form a pile.
            When that pile is cut and finished, it creates the raised vertical
            ribs that catch light and give the fabric its depth.
          </p>
          <h3>What Are Corduroy Wales?</h3>
          <p>
            Wales are the ribs running along the surface of the fabric. Their
            width and spacing help determine whether the corduroy looks fine,
            medium or bold.
          </p>
          <h3>Fine Wale Versus Wide Wale Corduroy</h3>
          <p>
            Fine-wale corduroy usually looks more refined and flexible. Wider
            wales create a stronger visual texture and often feel more
            substantial. PLEBS uses a mid-wale rib — enough texture to read as
            corduroy in movement and close-up, without an extreme wide-cord look.
          </p>
        </section>

        <section>
          <h2>What Does Cotton Corduroy Feel Like?</h2>
          <p>
            Cotton corduroy can feel soft, substantial or structured depending
            on its weight, wale width and finishing process. At 350 GSM with a
            mid-wale rib, the PLEBS cloth sits in the mid-weight range: enough
            body for the dungaree silhouette, soft enough for everyday wear.
          </p>
          <p>
            The raised ribs create a tactile surface, while the cotton fibre
            gives the fabric a more natural hand feel than many fully synthetic
            alternatives.
          </p>
          <dl className="editorial-page__specs">
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
              <dt>Finish</dt>
              <dd>{corduroyFabric.finish}</dd>
            </div>
            <div>
              <dt>Seasonal suitability</dt>
              <dd>{corduroyFabric.seasonalSuitability}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>Cotton Corduroy Versus Synthetic Corduroy</h2>
          <p>
            Cotton is not universally better in every category. The comparison
            below is a general guide, not a claim that every cotton corduroy
            outperforms every blend.
          </p>
          <div className="editorial-page__table-scroll">
            <table>
              <caption>
                General comparison of cotton and synthetic or blended corduroy
              </caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Cotton corduroy</th>
                  <th scope="col">Synthetic or blended corduroy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Main fibre</th>
                  <td>Cotton</td>
                  <td>Polyester, elastane or blends</td>
                </tr>
                <tr>
                  <th scope="row">Feel</th>
                  <td>Usually more natural and breathable</td>
                  <td>May feel smoother or more technical</td>
                </tr>
                <tr>
                  <th scope="row">Stretch</th>
                  <td>Limited unless blended</td>
                  <td>Can offer mechanical stretch</td>
                </tr>
                <tr>
                  <th scope="row">Heat sensitivity</th>
                  <td>Can shrink with excess heat</td>
                  <td>May react differently to heat</td>
                </tr>
                <tr>
                  <th scope="row">Texture</th>
                  <td>Depends on construction and finish</td>
                  <td>Depends on fibre and finish</td>
                </tr>
                <tr>
                  <th scope="row">Care</th>
                  <td>Requires label-specific care</td>
                  <td>Requires label-specific care</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Is Corduroy Breathable or Warm?</h2>
          <p>
            Corduroy’s comfort depends on fabric weight, construction and the
            clothing worn underneath. At 350 GSM, PLEBS cotton corduroy feels
            warmer than lightweight plain-woven cotton while still working as a
            year-round layering piece with the right top underneath.
          </p>
        </section>

        <section>
          <h2>Is Cotton Corduroy Durable?</h2>
          <p>
            Corduroy is often selected for garments that need structure and
            texture. Its durability depends on fabric weight, fibre quality,
            stitching, garment construction and how it is washed and worn.
          </p>
          <p>
            The raised ribs can show wear over time, particularly at
            high-friction areas. Proper care helps preserve the fabric’s
            appearance.
          </p>
        </section>

        <section>
          <h2>Why PLEBS Uses Cotton Corduroy</h2>
          <p>
            PLEBS uses 100% cotton corduroy at 350 GSM because it gives the
            dungarees a strong silhouette and a visible mid-wale texture without
            relying on large prints or decorative branding.
          </p>
          <p>
            It also works naturally with the green and earth-tone palette that
            defines the brand.
          </p>
          <div className="editorial-page__cta">
            <PrimaryButton
              href={siteConfig.product.path}
              eventName="select_item"
            >
              Shop the cotton corduroy dungarees
            </PrimaryButton>
          </div>
        </section>

        <section>
          <h2>How to Care for Cotton Corduroy</h2>
          <p>
            Corduroy should generally be treated carefully to protect colour,
            ribbed texture and shape. Always follow the care label attached to
            the finished garment.
          </p>
          <div className="editorial-page__cta">
            <Link href="/care-guide/" data-event="view_care_guide">
              Read the full corduroy care guide
            </Link>
          </div>
        </section>

        <section>
          <h2>Cotton Corduroy Questions</h2>
          <div className="editorial-page__faqs">
            {materialFaqs.map((item) => (
              <details key={item.question}>
                <summary data-event="faq_interaction">{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="editorial-page__final">
          <h2>See Cotton Corduroy on the PLEBS Dungarees</h2>
          <p>
            Explore the product page for fit, sizing and purchase details, or
            continue through the related material guides.
          </p>
          <div className="editorial-page__cta">
            <PrimaryButton
              href={siteConfig.product.path}
              eventName="select_item"
            >
              View the PLEBS dungarees
            </PrimaryButton>
          </div>
          <ul className="editorial-page__related">
            <li>
              <Link href="/care-guide/">
                How to wash and care for corduroy dungarees
              </Link>
            </li>
            <li>
              <Link href="/about/">Learn why PLEBS chose one product</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
