import Link from "next/link";
import { CheckoutReview } from "@/components/checkout/CheckoutReview";
import { getPaystackMode } from "@/lib/commerce/paystack";
import { createPageMetadata } from "@/lib/metadata";
import { getCheckoutOrder } from "@/lib/orders";
import { productData } from "@/lib/product";

export const metadata = createPageMetadata({
  title: "Review Order",
  description: "Review your PLEBS order and pay securely.",
  path: "/checkout/review/",
  noIndex: true,
});

export default async function CheckoutReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string" ? params.order : "";
  const checkoutToken = typeof params.token === "string" ? params.token : "";
  const paymentMode = getPaystackMode();

  if (!orderNumber || !checkoutToken) {
    return (
      <section className="section">
        <div className="container container--reading">
          <h1>Review unavailable</h1>
          <p>This checkout link is incomplete or has expired.</p>
          <p>
            <Link href={productData.path}>Return to the product</Link>
          </p>
        </div>
      </section>
    );
  }

  const order = await getCheckoutOrder({ orderNumber, checkoutToken });

  if (!order) {
    return (
      <section className="section">
        <div className="container container--reading">
          <h1>Review unavailable</h1>
          <p>We couldn&apos;t find this order, or the access link is invalid.</p>
          <p>
            <Link href="/checkout/">Start checkout again</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <CheckoutReview
          order={order}
          checkoutToken={checkoutToken}
          paymentMode={paymentMode}
        />
      </div>
    </section>
  );
}
