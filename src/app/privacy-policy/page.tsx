import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Privacy Policy | PLEBS",
  description:
    "How PLEBS intends to collect, use, store and protect personal information across the website, orders, analytics and email communications.",
  path: "/privacy-policy/",
  absoluteTitle: true,
});

export default function PrivacyPolicyPage() {
  return (
    <article className="editorial-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />

      <div className="container editorial-page__body">
        <header className="editorial-page__intro">
          <p className="editorial-page__kicker">Legal</p>
          <h1>Privacy Policy</h1>
          <p>
            This page outlines the privacy topics PLEBS must cover before launch.
            Final wording will be adapted to the live systems used for checkout,
            analytics, cookies and email, and should be reviewed for South
            African requirements.
          </p>
          <p className="editorial-page__note">
            Do not treat this framework as finished legal advice or a live
            policy.
          </p>
        </header>

        <section>
          <h2>Information Collected</h2>
          <p>
            Expected categories include contact details, order information,
            delivery addresses, support messages, newsletter emails and
            technical data such as device or browser information where analytics
            are enabled.
          </p>
        </section>

        <section>
          <h2>Reason for Collection</h2>
          <p>
            Information will be collected to process orders, provide customer
            support, improve the website, send requested communications and meet
            legal obligations. Exact purposes will be listed once systems are
            confirmed.
          </p>
        </section>

        <section>
          <h2>Payment Processing</h2>
          <p>
            Payments will be handled by the configured payment provider. Card
            details should not be stored directly by PLEBS unless a verified
            process requires and permits it.
          </p>
        </section>

        <section>
          <h2>Analytics and Cookies</h2>
          <p>
            PLEBS uses Google Analytics to understand site usage and the purchase
            funnel (for example page views, add to cart and checkout). Analytics
            cookies may be used for this purpose. Necessary site cookies keep
            cart and checkout working. Marketing emails are only sent when you
            give consent on a signup or restock form.
          </p>
        </section>

        <section>
          <h2>Email Marketing</h2>
          <p>
            Newsletter signup is optional. Marketing emails will only be sent
            where consent or another lawful basis is in place, with a clear
            unsubscribe method.
          </p>
        </section>

        <section>
          <h2>Retention</h2>
          <p>
            Retention periods for order, support and marketing records will be
            defined according to operational need and applicable law.
          </p>
        </section>

        <section>
          <h2>Third-Party Providers</h2>
          <p>
            Hosting, payment, courier, email and analytics providers will be
            named once contracted. Each provider should only receive the data
            needed for their role.
          </p>
        </section>

        <section>
          <h2>Customer Rights</h2>
          <p>
            Customers should be able to request access, correction or deletion of
            personal information where applicable. The process and response
            pathway will be published with the final policy.
          </p>
        </section>

        <section>
          <h2>Contact Information</h2>
          <p>
            Privacy questions can be sent through the{" "}
            <Link href="/contact/">PLEBS contact page</Link> once the support
            inbox is live. The dedicated privacy contact address remains to be
            confirmed.
          </p>
        </section>
      </div>
    </article>
  );
}
