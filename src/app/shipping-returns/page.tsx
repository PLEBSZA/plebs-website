import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Shipping, Exchanges and Returns | PLEBS",
  description:
    "Review PLEBS order processing, South African delivery, size exchanges, returns and refund information once fulfilment details are confirmed.",
  path: "/shipping-returns/",
  absoluteTitle: true,
});

export default function ShippingReturnsPage() {
  return (
    <article className="editorial-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shipping & Returns" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Order support</p>
          <h1>Shipping, Exchanges and Returns</h1>
          <p>
            This page explains how PLEBS intends to handle dispatch, delivery,
            size exchanges and returns. Final values will be published only after
            the fulfilment process and South African consumer-protection
            requirements have been checked.
          </p>
        </header>

        <section>
          <h2>Order Processing</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Order cut-off times</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Dispatch period</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Weekend and public-holiday handling</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Stock status</dt>
              <dd>Ready stock or made-to-order — confirm</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>South African Delivery</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Courier method</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Delivery costs</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Delivery estimates</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Remote-area handling</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Tracking</dt>
              <dd>To be confirmed</dd>
            </div>
          </dl>
          <p>
            Delivery estimates will vary by location and will not include
            unexpected courier delays.
          </p>
        </section>

        <section>
          <h2>International Delivery</h2>
          <p>
            International availability has not been confirmed. This page will
            state clearly whether orders can be shipped outside South Africa,
            together with duties, taxes and timing once that decision is made.
          </p>
        </section>

        <section>
          <h2>Size Exchanges</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Exchange period</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Eligibility</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Garment condition</dt>
              <dd>Unworn, unwashed and with original tags — confirm</dd>
            </div>
            <div>
              <dt>Tags and packaging</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Customer process</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Shipping costs</dt>
              <dd>To be confirmed</dd>
            </div>
          </dl>
          <p>
            Size exchanges are intended to reduce fit risk, not to replace a
            clear measurement process. Use the{" "}
            <Link href="/size-guide/">PLEBS corduroy dungarees size guide</Link>{" "}
            before ordering where possible.
          </p>
        </section>

        <section>
          <h2>Returns and Refunds</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Return period</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Refund eligibility</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Exclusions</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Processing time</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Payment method</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Original delivery charges</dt>
              <dd>To be confirmed</dd>
            </div>
          </dl>
          <p>
            The operational returns process must align with the{" "}
            <Link href="/refund-policy/">refund policy</Link> before checkout
            opens.
          </p>
        </section>

        <section>
          <h2>Faulty or Incorrect Items</h2>
          <p>
            If an order arrives damaged, faulty or incorrect, contact PLEBS with
            the order number, a short description of the issue and clear
            photographs once the support channel is live.
          </p>
          <p>
            The exact resolution path—repair, replacement, exchange or
            refund—will be confirmed with the final policy.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Support email</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Expected response time</dt>
              <dd>To be confirmed</dd>
            </div>
          </dl>
          <ul className="editorial-page__related">
            <li>
              <Link href="/contact/">Open the PLEBS contact form</Link>
            </li>
            <li>
              <Link href="/products/cotton-corduroy-dungarees/">
                Return to the corduroy dungarees product page
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
