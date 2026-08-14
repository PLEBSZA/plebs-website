import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { CheckoutReview } from "@/components/checkout/CheckoutReview";
import {
  CHECKOUT_COOKIE_NAME,
  parseCheckoutCookieValue,
} from "@/lib/checkout/cookie";
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

async function CheckoutReviewContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const fromCookie = parseCheckoutCookieValue(
    cookieStore.get(CHECKOUT_COOKIE_NAME)?.value,
  );
  const orderNumber =
    (typeof params.order === "string" ? params.order : "") ||
    fromCookie?.orderNumber ||
    "";
  const checkoutToken =
    (typeof params.token === "string" ? params.token : "") ||
    fromCookie?.checkoutToken ||
    "";
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
          uiState={order.paymentReady ? "PAYMENT_READY" : "PREPARING"}
          paymentReady={order.paymentReady}
          authorizationUrl={order.authorizationUrl}
        />
      </div>
    </section>
  );
}

export default function CheckoutReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <section className="section">
          <div className="container container--reading">
            <h1>Reviewing your order</h1>
            <p>Loading checkout details…</p>
          </div>
        </section>
      }
    >
      <CheckoutReviewContent searchParams={searchParams} />
    </Suspense>
  );
}
