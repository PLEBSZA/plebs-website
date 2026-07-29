import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import { lifestyleProductImage } from "@/lib/media";
import { siteConfig } from "@/lib/site";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildGraph,
} from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "About PLEBS | Independent Clothing Brand",
  description:
    "Learn why PLEBS created its signature 100% cotton corduroy dungarees, how the brand approaches design and what makes the product distinctly PLEBS.",
  path: "/about/",
  absoluteTitle: true,
});

export default function AboutPage() {
  const structuredData = buildGraph([
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "About PLEBS", path: "/about/" },
    ]),
    {
      "@type": "AboutPage",
      "@id": absoluteUrl("/about/#webpage"),
      url: absoluteUrl("/about/"),
      name: "About PLEBS",
      description:
        "Learn why PLEBS created its signature 100% cotton corduroy dungarees, how the brand approaches design and what makes the product distinctly PLEBS.",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    },
  ]);

  return (
    <article className="editorial-page">
      <JsonLd data={structuredData} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "About PLEBS" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Independent clothing brand</p>
          <h1>We Made One Product Worth Building a Brand Around</h1>
          <p>
            PLEBS began with a simple idea: make a pair of dungarees with enough
            character to stand on its own.
          </p>
          <p>
            Instead of launching a large catalogue, we focused on one
            design—100% cotton corduroy dungarees made for everyday wear,
            layering and individual styling.
          </p>
        </header>

        <div className="editorial-page__media">
          <Image
            src={lifestyleProductImage.src}
            alt={lifestyleProductImage.alt}
            width={lifestyleProductImage.width}
            height={lifestyleProductImage.height}
            className="editorial-page__image"
            sizes="(max-width: 900px) calc(100vw - 2rem), 832px"
          />
        </div>

        <section>
          <h2>Why PLEBS?</h2>
          <p>
            Clothing does not need to be loud to have personality. It also does
            not need to follow every trend to feel relevant.
          </p>
          <p>
            PLEBS is built around clothing that feels distinct, practical and
            easy to make your own. The name reflects a refusal to take fashion
            hierarchy too seriously. The garment matters more than status,
            labels or rules about who should wear what.
          </p>
          <p className="editorial-page__note">
            The verified origin of the name and founding story will be added
            once documented by the people behind the brand.
          </p>
        </section>

        <section>
          <h2>Why Start With One Product?</h2>
          <p>
            A larger catalogue would not automatically make PLEBS a stronger
            brand. It would only create more products to photograph, explain,
            stock and sell.
          </p>
          <p>
            We chose to begin with one design and give it the attention it
            deserves—from fabric and fit to sizing, photography and care
            information. New products should only be added when they genuinely
            strengthen the range.
          </p>
        </section>

        <section>
          <h2>Why Dungarees?</h2>
          <p>
            Dungarees are practical, recognisable and unusually adaptable. They
            can be worn simply or styled with strong colour, texture and layers.
          </p>
          <p>
            Their construction also allows a garment to feel relaxed without
            looking unfinished. That balance made dungarees the right starting
            point for PLEBS.
          </p>
        </section>

        <section>
          <h2>Why Corduroy?</h2>
          <p>
            Corduroy has visual depth without needing printed graphics. Its
            raised ribs give the fabric texture, structure and character that
            changes subtly with movement and light.
          </p>
          <p>
            For PLEBS, 350 GSM mid-wale cotton corduroy creates a stronger
            identity than a flat woven fabric while remaining practical enough
            for repeat wear.
          </p>
          <div className="editorial-page__cta">
            <PrimaryButton href="/cotton-corduroy/" eventName="select_item">
              Explore the fabric
            </PrimaryButton>
          </div>
        </section>

        <section>
          <h2>Designed With Intention</h2>
          <p>
            The dungarees are cut in a relaxed silhouette from 100% cotton
            corduroy at 350 GSM, with adjustable self-fabric straps, side
            pockets and a bib placket. Manufacturing origin details are listed
            only when verified.
          </p>
          <dl className="editorial-page__specs">
            <div>
              <dt>Cloth</dt>
              <dd>100% cotton corduroy, 350 GSM, mid-wale</dd>
            </div>
            <div>
              <dt>Country of design</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Country of manufacture</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Fit reference</dt>
              <dd>Size chart published; models wear Size S</dd>
            </div>
            <div>
              <dt>Colour development</dt>
              <dd>Forest Green in stock; earth tone when available</dd>
            </div>
          </dl>
          <p className="editorial-page__note">
            Claims such as carefully made, ethically produced, sustainably
            sourced or locally crafted will only appear with clear evidence.
          </p>
        </section>

        <section>
          <h2>The People Behind PLEBS</h2>
          <div className="editorial-page__split">
            <div>
              <p>
                Founder names, portraits and short introductions will appear
                here once the people behind the brand are ready to publish them.
              </p>
              <p>
                The section will stay human and concise: who they are, relevant
                background and why this product matters to them.
              </p>
            </div>
            <ImagePlaceholder label="Founder portrait or working image" aspect="portrait" />
          </div>
        </section>

        <section className="editorial-page__final">
          <h2>Meet the PLEBS Original</h2>
          <p>One product. One strong material. More than one way to wear it.</p>
          <div className="editorial-page__cta">
            <PrimaryButton
              href={siteConfig.product.path}
              eventName="select_item"
            >
              Shop the Corduroy Dungarees
            </PrimaryButton>
          </div>
          <ul className="editorial-page__related">
            <li>
              <Link href="/cotton-corduroy/">
                Read the cotton corduroy fabric guide
              </Link>
            </li>
            <li>
              <Link href="/size-guide/">
                View the PLEBS corduroy dungarees size guide
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
