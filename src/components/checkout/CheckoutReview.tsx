"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import { getShippingMethod } from "@/lib/shipping";
import { stashPendingPurchase } from "@/lib/analytics/emit";
import styles from "./CheckoutReview.module.css";

export type CheckoutReviewOrder = {
  id: string;
  number: string;
  status: "awaiting_payment" | "paid" | "cancelled";
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
  checkoutToken: string;
  paymentMode: "test" | "live" | "unconfigured";
};

export function CheckoutReview({
  order,
  checkoutToken,
  paymentMode,
}: CheckoutReviewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "paying" | "cancelling" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const shipping = getShippingMethod(order.shippingMethodId);

  async function handlePayNow() {
    setStatus("paying");
    setError("");

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
        setStatus("error");
        setError(result.message ?? "Unable to open Paystack checkout.");
        return;
      }

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

      window.location.href = result.authorizationUrl;
    } catch {
      setStatus("error");
      setError("Something went wrong connecting to Paystack.");
    }
  }

  async function handleCancel() {
    setStatus("cancelling");
    setError("");

    try {
      const response = await fetch("/api/checkout/cancel/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          checkoutToken,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setError(result.message ?? "Unable to cancel this order.");
        return;
      }

      router.push(productData.path);
    } catch {
      setStatus("error");
      setError("Something went wrong while cancelling.");
    }
  }

  if (order.status === "cancelled") {
    return (
      <div className={styles.shell}>
        <article className={styles.card}>
          <p className={styles.step}>Checkout</p>
          <h1>Order Cancelled</h1>
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
          <p className={styles.lead}>
            Order {order.number} is already paid.
          </p>
          <Link
            className={styles.primary}
            href={`/order-confirmation/?order=${encodeURIComponent(order.number)}&paid=true`}
          >
            View confirmation
          </Link>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <article className={styles.card}>
        <p className={styles.step}>Step 2 of 2 · Review & pay</p>
        <h1>Confirm Your Order</h1>
        <p className={styles.lead}>
          Check the details below, then pay securely
          {paymentMode === "test"
            ? " with Paystack test mode"
            : paymentMode === "live"
              ? " with Paystack"
              : ""}
          . You won&apos;t be charged until you complete payment on the next
          screen.
        </p>

        <dl className={styles.meta}>
          <div>
            <dt>Order number</dt>
            <dd>{order.number}</dd>
          </div>
          <div>
            <dt>Total due</dt>
            <dd>{formatMoney(order.total, order.currency)}</dd>
          </div>
        </dl>

        <section className={styles.section}>
          <h2>Item</h2>
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
          <h2>Customer</h2>
          <p>
            {order.customer.firstName} {order.customer.lastName}
          </p>
          <p>{order.customer.email}</p>
          <p>{order.customer.phone}</p>
        </section>

        <section className={styles.section}>
          <h2>Shipping</h2>
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
            {shipping?.name ?? "Standard Delivery"} ·{" "}
            {order.shippingPrice === 0
              ? "Free"
              : formatMoney(order.shippingPrice, order.currency)}
          </p>
        </section>

        <section className={styles.section}>
          <h2>Totals</h2>
          <div className={styles.row}>
            <span>Subtotal</span>
            <strong>{formatMoney(order.subtotal, order.currency)}</strong>
          </div>
          <div className={styles.row}>
            <span>Shipping</span>
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

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={handlePayNow}
            disabled={
              paymentMode === "unconfigured" ||
              status === "paying" ||
              status === "cancelling"
            }
          >
            {status === "paying"
              ? "Opening Paystack…"
              : paymentMode === "unconfigured"
                ? "Payment Unavailable"
                : "Pay Now"}
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleCancel}
            disabled={status === "paying" || status === "cancelling"}
          >
            {status === "cancelling" ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>

        <p className={styles.note}>
          {paymentMode === "unconfigured"
            ? "Paystack is not configured yet, so payment cannot start."
            : "Pay Now opens the secure Paystack payment page."}
        </p>
      </article>
    </div>
  );
}
