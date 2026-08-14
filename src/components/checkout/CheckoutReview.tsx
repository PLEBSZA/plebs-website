"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import { getShippingMethod } from "@/lib/shipping";
import { stashPendingPurchase } from "@/lib/analytics/emit";
import { payEnabled, type CheckoutUiState } from "@/lib/checkout/policy";
import styles from "./CheckoutReview.module.css";

export type CheckoutReviewOrder = {
  id: string;
  number: string;
  status: "awaiting_payment" | "paid" | "cancelled" | "preparing";
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    suburb?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  billingSameAsShipping: boolean;
  shippingMethodId: string;
  shippingPrice: number;
  line: {
    productName: string;
    colour: string;
    size: string;
    quantity: number;
    unitPrice: number;
    sku: string | null;
  };
  subtotal: number;
  total: number;
  currency: string;
  checkoutToken?: string;
};

type CheckoutReviewProps = {
  order: CheckoutReviewOrder;
  checkoutToken?: string;
  paymentMode: "test" | "live" | "unconfigured";
  uiState: CheckoutUiState;
  paymentReady: boolean;
  authorizationUrl?: string | null;
  preparationError?: string | null;
  onEdit?: () => void;
  onRetryPrepare?: () => void;
};

export function CheckoutReview({
  order,
  checkoutToken,
  paymentMode,
  uiState,
  paymentReady,
  authorizationUrl,
  preparationError,
  onEdit,
  onRetryPrepare,
}: CheckoutReviewProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryUrl, setRetryUrl] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const shipping = getShippingMethod(order.shippingMethodId);
  const resolvedUrl = retryUrl ?? authorizationUrl;
  const canPay =
    Boolean(resolvedUrl) &&
    paymentMode !== "unconfigured" &&
    (payEnabled(uiState, paymentReady) || Boolean(retryUrl));

  async function handlePayNow() {
    if (!resolvedUrl || !canPay) return;
    const payStarted = performance.now();

    stashPendingPurchase({
      transaction_id: order.number,
      currency: order.currency,
      value: order.total,
      items: [
        {
          item_id: order.line.sku ?? order.line.productName,
          item_name: order.line.productName,
          item_variant: `${order.line.colour} / ${order.line.size}`,
          price: order.line.unitPrice,
          quantity: order.line.quantity,
        },
      ],
    });

    window.dispatchEvent(
      new CustomEvent("plebs:commerce-event", {
        detail: {
          event: "add_payment_info",
          selected_size: order.line.size,
          colour: order.line.colour,
          quantity: order.line.quantity,
          variant_sku: order.line.sku,
          ecommerce: {
            currency: order.currency,
            value: order.total,
            payment_type: "Paystack",
            items: [
              {
                item_id: order.line.sku ?? order.line.productName,
                item_name: order.line.productName,
                item_variant: `${order.line.colour} / ${order.line.size}`,
                price: order.line.unitPrice,
                quantity: order.line.quantity,
              },
            ],
          },
        },
      }),
    );
    window.dispatchEvent(
      new CustomEvent("plebs:commerce-event", {
        detail: {
          event: "pay_click_to_navigation_ms",
          value: String(Math.round(performance.now() - payStarted)),
        },
      }),
    );

    window.location.assign(resolvedUrl);
  }

  async function retryInitialize() {
    if (!order.id || !checkoutToken) {
      onRetryPrepare?.();
      return;
    }
    setRetrying(true);
    setRetryError(null);
    try {
      const response = await fetch("/api/payments/paystack/initialize/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          checkoutToken,
        }),
      });
      const result = (await response.json()) as {
        authorizationUrl?: string;
        message?: string;
      };
      if (!response.ok || !result.authorizationUrl) {
        setRetryError(result.message ?? "Unable to prepare payment.");
        return;
      }
      setRetryUrl(result.authorizationUrl);
    } catch {
      setRetryError("Paystack could not be reached. Try again.");
    } finally {
      setRetrying(false);
    }
  }

  async function handleCancel() {
    if (!order.id || !checkoutToken || order.status === "preparing") {
      router.push(productData.path);
      return;
    }

    try {
      await fetch("/api/checkout/cancel/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          checkoutToken,
        }),
      });
    } finally {
      router.push(productData.path);
    }
  }

  if (order.status === "cancelled") {
    return (
      <div className={styles.shell}>
        <article className={styles.card}>
          <p className={styles.step}>Checkout</p>
          <h1>Checkout cancelled</h1>
          <p className={styles.lead}>
            Order {order.number} has been cancelled and stock has been released.
          </p>
          <Link className={styles.primary} href={productData.path}>
            Return to the product
          </Link>
        </article>
      </div>
    );
  }

  if (order.status === "paid") {
    return (
      <div className={styles.shell}>
        <article className={styles.card}>
          <p className={styles.step}>Checkout</p>
          <h1>Already Paid</h1>
          <p className={styles.lead}>Order {order.number} is already paid.</p>
          <Link
            className={styles.primary}
            href={`/order-confirmation/?order=${encodeURIComponent(order.number)}`}
          >
            View confirmation
          </Link>
        </article>
      </div>
    );
  }

  const statusLabel =
    uiState === "PAYMENT_READY"
      ? "Secure payment ready"
      : uiState === "PREPARATION_ERROR"
        ? "We could not finish preparing payment"
        : "Reserving your item…";

  return (
    <div className={styles.shell}>
      <article className={styles.card}>
        <p className={styles.step}>Step 2 of 2 · Review & pay</p>
        <h1>Review your order</h1>
        <p className={styles.lead}>
          Check the item, total and delivery address, then pay securely
          {paymentMode === "test"
            ? " with Paystack test mode"
            : paymentMode === "live"
              ? " with Paystack"
              : ""}
          .
        </p>
        <p className={styles.status} aria-live="polite">
          {statusLabel}
        </p>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Item</h2>
            {onEdit ? (
              <button type="button" className={styles.edit} onClick={onEdit}>
                Edit item
              </button>
            ) : (
              <Link className={styles.edit} href="/checkout/">
                Edit item
              </Link>
            )}
          </div>
          <div className={styles.item}>
            <div>
              <strong>{order.line.productName}</strong>
              <p>
                {order.line.colour} · Size {order.line.size} · Qty{" "}
                {order.line.quantity}
              </p>
            </div>
            <strong>
              {formatMoney(
                order.line.unitPrice * order.line.quantity,
                order.currency,
              )}
            </strong>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Delivery</h2>
            {onEdit ? (
              <button type="button" className={styles.edit} onClick={onEdit}>
                Edit details
              </button>
            ) : (
              <Link className={styles.edit} href="/checkout/">
                Edit details
              </Link>
            )}
          </div>
          <p>
            {order.customer.firstName} {order.customer.lastName}
          </p>
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 ? (
            <p>{order.shippingAddress.line2}</p>
          ) : null}
          {order.shippingAddress.suburb ? (
            <p>{order.shippingAddress.suburb}</p>
          ) : null}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
            {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.country}</p>
          <p className={styles.muted}>
            {shipping?.name ?? "Standard Delivery"} · Free tracked delivery in
            South Africa
          </p>
          <p className={styles.muted}>
            Timing to be confirmed
          </p>
        </section>

        <section className={styles.section}>
          <h2>Total</h2>
          <div className={styles.row}>
            <span>Subtotal</span>
            <strong>{formatMoney(order.subtotal, order.currency)}</strong>
          </div>
          <div className={styles.row}>
            <span>Delivery</span>
            <strong>
              {order.shippingPrice === 0
                ? "Free"
                : formatMoney(order.shippingPrice, order.currency)}
            </strong>
          </div>
          <div className={styles.total}>
            <span>Total</span>
            <strong>{formatMoney(order.total, order.currency)}</strong>
          </div>
        </section>

        {preparationError || retryError ? (
          <p className={styles.error} role="alert">
            {retryError ?? preparationError}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => void handlePayNow()}
            disabled={!canPay || uiState === "PAYMENT_OPENING"}
          >
            {paymentMode === "unconfigured"
              ? "Payment Unavailable"
              : canPay
                ? `Pay ${formatMoney(order.total, order.currency)} securely`
                : "Pay securely"}
          </button>
          {(uiState === "PREPARATION_ERROR" || (!canPay && order.id && checkoutToken)) &&
          !retrying ? (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                if (onRetryPrepare) onRetryPrepare();
                else void retryInitialize();
              }}
            >
              Try preparing payment again
            </button>
          ) : null}
          {retrying ? (
            <p className={styles.muted}>Preparing secure payment…</p>
          ) : null}
          <button
            type="button"
            className={styles.cancel}
            onClick={() => void handleCancel()}
          >
            Cancel checkout
          </button>
        </div>

        <p className={styles.note}>
          {paymentMode === "unconfigured"
            ? "Paystack is not configured yet, so payment cannot start."
            : paymentMode === "test"
              ? "Paystack is in test mode. You will not be charged a live payment."
              : "Pay opens the secure Paystack payment page."}
        </p>
      </article>
    </div>
  );
}
