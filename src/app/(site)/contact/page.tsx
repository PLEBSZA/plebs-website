import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ContactForm } from "@/components/support/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/metadata";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildGraph,
} from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "Contact PLEBS | Product, Order and Sizing Help",
  description:
    "Contact PLEBS about product details, sizing, existing orders, exchanges, restocks or general questions about the cotton corduroy dungarees.",
  path: "/contact/",
  absoluteTitle: true,
});

export default function ContactPage() {
  const structuredData = buildGraph([
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact/" },
    ]),
    {
      "@type": "ContactPage",
      "@id": absoluteUrl("/contact/#webpage"),
      url: absoluteUrl("/contact/"),
      name: "Talk to PLEBS",
      description:
        "Contact PLEBS about product details, sizing, existing orders, exchanges, restocks or general questions.",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    },
  ]);

  return (
    <article className="editorial-page">
      <JsonLd data={structuredData} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Contact" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Customer support</p>
          <h1>Talk to PLEBS</h1>
          <p>
            Use this page for product and sizing questions, existing orders,
            exchanges, restocks, press requests and general enquiries. Contact
            methods will only remain published if they are actively monitored.
          </p>
        </header>

        <section>
          <h2>Support Details</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Support email</dt>
              <dd>
                <a href="mailto:hello@plebs.co.za">hello@plebs.co.za</a>
              </dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>Only if actively managed — currently not published</dd>
            </div>
            <div>
              <dt>Response-time expectation</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Business address</dt>
              <dd>Published only where appropriate — to be confirmed</dd>
            </div>
            <div>
              <dt>Social links</dt>
              <dd>To be confirmed</dd>
            </div>
          </dl>
          <p>
            For fit questions, start with the{" "}
            <Link href="/size-guide/">PLEBS corduroy dungarees size guide</Link>
            . For delivery and exchange rules, see{" "}
            <Link href="/shipping-returns/">shipping, exchanges and returns</Link>
            .
          </p>
        </section>

        <section>
          <h2>Send a Message</h2>
          <p>
            Keep the form short and specific. Include your order number if the
            enquiry relates to an existing purchase.
          </p>
          <ContactForm />
        </section>

        <section>
          <h2>Order Support Instructions</h2>
          <ul>
            <li>Have your order number ready when available</li>
            <li>Describe the product, size and colour concerned</li>
            <li>Attach clear photos only when they help resolve the issue</li>
            <li>
              Use the exchange or return process once those policies are live
            </li>
          </ul>
          <ul className="editorial-page__related">
            <li>
              <Link href="/products/cotton-corduroy-dungarees/">
                View the PLEBS cotton corduroy dungarees
              </Link>
            </li>
            <li>
              <Link href="/refund-policy/">Read the refund policy outline</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
