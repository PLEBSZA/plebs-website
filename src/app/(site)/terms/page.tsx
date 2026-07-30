import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Terms and Conditions | PLEBS",
  description:
    "Website use, product information, pricing, orders, payment, stock, delivery and liability terms for PLEBS.",
  path: "/terms/",
  absoluteTitle: true,
});

export default function TermsPage() {
  return (
    <article className="editorial-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Terms" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Legal</p>
          <h1>Terms &amp; Conditions</h1>
          <p>
            These headings mark the commercial and website terms PLEBS needs
            before selling online. Final wording must match the live checkout,
            stock and fulfilment systems and should be reviewed under South
            African law.
          </p>
          <p className="editorial-page__note">
            This page is a structured outline, not a finished legal agreement.
          </p>
        </header>

        <section>
          <h2>Website Use</h2>
          <p>
            Visitors may use the website to browse product information, sizing
            guidance and support content. Misuse, scraping or interference with
            site security will be prohibited in the final terms.
          </p>
        </section>

        <section>
          <h2>Product Information</h2>
          <p>
            PLEBS aims to describe the dungarees accurately, including fabric,
            fit and care details. Colour appearance can vary by screen and
            lighting. Confirmed specifications will replace provisional copy
            before purchase opens.
          </p>
        </section>

        <section>
          <h2>Prices</h2>
          <p>
            Prices will be shown in South African Rand unless otherwise stated.
            Tax treatment, promotions and pricing errors will be covered once
            commercial settings are final.
          </p>
        </section>

        <section>
          <h2>Order Acceptance</h2>
          <p>
            An order confirmation does not automatically create a completed sale
            until payment and stock validation succeed under the confirmed
            process.
          </p>
        </section>

        <section>
          <h2>Payment</h2>
          <p>
            Accepted payment methods will be listed when the payment provider is
            connected. Orders may be cancelled if payment cannot be completed.
          </p>
        </section>

        <section>
          <h2>Stock</h2>
          <p>
            Availability can change. If a selected size or colour cannot be
            fulfilled, PLEBS will contact the customer with the available
            options once the order system is live.
          </p>
        </section>

        <section>
          <h2>Delivery</h2>
          <p>
            Delivery terms will follow the published{" "}
            <Link href="/shipping-returns/">shipping, exchanges and returns</Link>{" "}
            page. Timing estimates are not guarantees of exact arrival dates.
          </p>
        </section>

        <section>
          <h2>Intellectual Property</h2>
          <p>
            Brand names, product imagery, copy and design assets on this website
            belong to PLEBS or its licensors and may not be reused without
            permission.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p>
            Liability limits, consumer rights and exclusions will be written to
            reflect applicable South African law and the actual services PLEBS
            provides.
          </p>
        </section>

        <section>
          <h2>Governing Law</h2>
          <p>
            The final terms will state the governing law and dispute process for
            the business. South Africa is the intended jurisdiction unless legal
            review determines otherwise.
          </p>
          <ul className="editorial-page__related">
            <li>
              <Link href="/privacy-policy/">Read the privacy policy outline</Link>
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
