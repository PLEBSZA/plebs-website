import Link from "next/link";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { createPageMetadata } from "@/lib/metadata";
import { productData } from "@/lib/product";

export const metadata = createPageMetadata({
  title: "Order Confirmed",
  description: "Thank you for your PLEBS order.",
  path: "/order-confirmation/",
  noIndex: true,
});

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string" ? params.order : null;

  return (
    <section className="section">
      <div className="container container--reading">
        <p className="editorial-page__kicker">Order confirmed</p>
        <h1>Thank You.</h1>
        <p>Your PLEBS order has been received.</p>

        {orderNumber ? (
          <dl className="editorial-page__specs">
            <div>
              <dt>Order number</dt>
              <dd>{orderNumber}</dd>
            </div>
            <div>
              <dt>Item</dt>
              <dd>{productData.shortName}</dd>
            </div>
            <div>
              <dt>Dispatch</dt>
              <dd>Dispatch timing to be confirmed</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                Payment gateway is pending. You will receive a payment link
                when the checkout integration is connected.
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="editorial-page__cta">
          <PrimaryButton href="/" eventName="continue_shopping">
            Continue Shopping
          </PrimaryButton>
        </div>

        <ul className="editorial-page__related">
          <li>
            <Link href="/care-guide/" data-event="view_care_guide">
              Read the care guide
            </Link>
          </li>
          <li>
            <Link href="/shipping-returns/" data-event="view_shipping_policy">
              Shipping and returns
            </Link>
          </li>
          <li>
            <Link href="/contact/">Need help with your order?</Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
