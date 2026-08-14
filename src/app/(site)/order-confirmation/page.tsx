import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { PurchaseBeacon } from "@/components/analytics/PurchaseBeacon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  CHECKOUT_COOKIE_NAME,
  CONFIRMATION_COOKIE_NAME,
  parseCheckoutCookieValue,
} from "@/lib/checkout/cookie";
import {
  confirmationCopy,
  confirmationTone,
} from "@/lib/checkout/confirmation";
import { resolveCheckoutConfirmationLookup } from "@/lib/checkout/policy";
import { createPageMetadata } from "@/lib/metadata";
import { getCheckoutOrder } from "@/lib/orders";
import { productData } from "@/lib/product";

export const metadata = createPageMetadata({
  title: "Order Confirmed",
  description: "Thank you for your PLEBS order.",
  path: "/order-confirmation/",
  noIndex: true,
});

async function resolveConfirmedOrder(input: {
  orderNumber: string | null;
  paymentFailed: boolean;
}) {
  const cookieStore = await cookies();
  const fromCheckout = parseCheckoutCookieValue(
    cookieStore.get(CHECKOUT_COOKIE_NAME)?.value,
  );
  const fromConfirmation = parseCheckoutCookieValue(
    cookieStore.get(CONFIRMATION_COOKIE_NAME)?.value,
  );
  const lookup = resolveCheckoutConfirmationLookup({
    checkoutOrderNumber: fromCheckout?.orderNumber,
    checkoutToken: fromCheckout?.checkoutToken,
    confirmationOrderNumber: fromConfirmation?.orderNumber,
    confirmationToken: fromConfirmation?.checkoutToken,
    queryOrderNumber: input.orderNumber,
  });
  if (!lookup) {
    return {
      orderNumber: input.orderNumber,
      paid: false,
      paymentFailed: input.paymentFailed,
    };
  }

  const order = await getCheckoutOrder({
    orderNumber: lookup.orderNumber,
    checkoutToken: lookup.checkoutToken,
  });
  if (!order) {
    return {
      orderNumber: input.orderNumber,
      paid: false,
      paymentFailed: input.paymentFailed,
    };
  }

  return {
    orderNumber: order.number,
    paid: order.status === "paid",
    paymentFailed: input.paymentFailed && order.status !== "paid",
  };
}

async function OrderConfirmationContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string" ? params.order : null;
  const paymentFailed = params.error === "payment_failed";
  const confirmed = await resolveConfirmedOrder({
    orderNumber,
    paymentFailed,
  });
  const copy = confirmationCopy(
    confirmationTone({
      paid: confirmed.paid,
      paymentFailed: confirmed.paymentFailed,
    }),
  );

  return (
    <section className="section">
      <PurchaseBeacon
        orderNumber={confirmed.orderNumber}
        paid={confirmed.paid}
      />
      <div className="container container--reading">
        <p className="editorial-page__kicker">{copy.kicker}</p>
        <h1>{copy.heading}</h1>
        <p>{copy.body}</p>

        {confirmed.orderNumber ? (
          <dl className="editorial-page__specs">
            <div>
              <dt>Order number</dt>
              <dd>{confirmed.orderNumber}</dd>
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
                {copy.paymentLabel}
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

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <section className="section">
          <div className="container container--reading">
            <h1>Confirming your order</h1>
            <p>Loading…</p>
          </div>
        </section>
      }
    >
      <OrderConfirmationContent searchParams={searchParams} />
    </Suspense>
  );
}
