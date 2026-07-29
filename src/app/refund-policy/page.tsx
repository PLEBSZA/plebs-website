import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Refund Policy | PLEBS",
  description:
    "Refund, exchange and return eligibility for PLEBS cotton corduroy dungarees. Final windows and conditions will match the live returns process.",
  path: "/refund-policy/",
  absoluteTitle: true,
});

export default function RefundPolicyPage() {
  return (
    <article className="editorial-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Refund Policy" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Legal</p>
          <h1>Refund Policy</h1>
          <p>
            This policy must align exactly with the operational returns process
            published on the shipping and returns page. Values remain provisional
            until the business process and consumer-law review are complete.
          </p>
        </header>

        <section>
          <h2>Refund and Exchange Windows</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Return window</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Exchange window</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Condition required</dt>
              <dd>Unworn, unwashed and with original tags — confirm</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>Eligibility</h2>
          <p>
            Refunds and exchanges will only apply where the garment meets the
            published condition requirements and the request falls within the
            confirmed window. Sale-item rules, if any, will be stated clearly.
          </p>
        </section>

        <section>
          <h2>Refund Method and Timing</h2>
          <dl className="editorial-page__specs">
            <div>
              <dt>Refund method</dt>
              <dd>Original payment method — confirm</dd>
            </div>
            <div>
              <dt>Processing time</dt>
              <dd>To be confirmed</dd>
            </div>
            <div>
              <dt>Original delivery charges</dt>
              <dd>To be confirmed</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>Faulty Items</h2>
          <p>
            Faulty or incorrect items will follow a separate resolution path.
            Contact PLEBS with order details and supporting photos once the
            support channel is active.
          </p>
        </section>

        <section>
          <h2>Related Policies</h2>
          <ul className="editorial-page__related">
            <li>
              <Link href="/shipping-returns/">
                View shipping, exchanges and returns
              </Link>
            </li>
            <li>
              <Link href="/terms/">View the website terms outline</Link>
            </li>
            <li>
              <Link href="/contact/">Contact PLEBS about a return</Link>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
