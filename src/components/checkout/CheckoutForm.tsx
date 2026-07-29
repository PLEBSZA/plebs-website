"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import { shippingMethods } from "@/lib/shipping";
import styles from "./CheckoutForm.module.css";

export function CheckoutForm() {
  const router = useRouter();
  const { line, subtotal, clearCart } = useCart();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");
  const [billingSame, setBillingSame] = useState(true);

  const selectedShipping = shippingMethods[0];
  const total = subtotal + (selectedShipping?.price ?? 0);

  if (!line) {
    return (
      <div className={styles.empty}>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link href={productData.path}>Shop the Dungarees</Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!line) return;

    setStatus("submitting");
    setError("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          shippingLine1: data.shippingLine1,
          shippingLine2: data.shippingLine2,
          shippingCity: data.shippingCity,
          shippingProvince: data.shippingProvince,
          shippingPostalCode: data.shippingPostalCode,
          shippingCountry: data.shippingCountry || "South Africa",
          billingSameAsShipping: billingSame,
          billingLine1: billingSame ? undefined : data.billingLine1,
          billingLine2: billingSame ? undefined : data.billingLine2,
          billingCity: billingSame ? undefined : data.billingCity,
          billingProvince: billingSame ? undefined : data.billingProvince,
          billingPostalCode: billingSame ? undefined : data.billingPostalCode,
          billingCountry: billingSame ? undefined : (data.billingCountry || "South Africa"),
          shippingMethodId: selectedShipping?.id ?? "standard",
          colour: line.colour,
          size: line.size,
          quantity: line.quantity,
        }),
      });

      const result = (await response.json()) as {
        orderId?: string;
        orderNumber?: string;
        paymentUrl?: string;
        paymentReference?: string;
        message?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setError(result.message ?? "Unable to complete your order.");
        return;
      }

      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: {
            event: "purchase",
            selected_size: line.size,
            availability: "in_stock",
            variant_sku: line.sku,
            colour: line.colour,
            quantity: line.quantity,
          },
        }),
      );

      clearCart();

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      router.push(
        `/order-confirmation/?order=${encodeURIComponent(result.orderNumber ?? "")}`,
      );
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.main}>
        <h1>Checkout</h1>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Customer Information</legend>
          <div className={styles.grid}>
            <label className={styles.field}>
              Email
              <input type="email" name="email" autoComplete="email" required />
            </label>
            <label className={styles.field}>
              First name
              <input name="firstName" autoComplete="given-name" required />
            </label>
            <label className={styles.field}>
              Last name
              <input name="lastName" autoComplete="family-name" required />
            </label>
            <label className={styles.field}>
              Phone
              <input type="tel" name="phone" autoComplete="tel" required />
            </label>
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Shipping Address</legend>
          <div className={styles.grid}>
            <label className={styles.field}>
              Address
              <input name="shippingLine1" autoComplete="address-line1" required />
            </label>
            <label className={styles.field}>
              Apartment or suite (optional)
              <input name="shippingLine2" autoComplete="address-line2" />
            </label>
            <label className={styles.field}>
              City
              <input name="shippingCity" autoComplete="address-level2" required />
            </label>
            <label className={styles.field}>
              Province
              <input name="shippingProvince" autoComplete="address-level1" required />
            </label>
            <label className={styles.field}>
              Postal code
              <input name="shippingPostalCode" autoComplete="postal-code" required inputMode="numeric" pattern="\d{4}" />
            </label>
            <label className={styles.field}>
              Country
              <input name="shippingCountry" autoComplete="country-name" defaultValue="South Africa" required />
            </label>
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Shipping</legend>
          {selectedShipping ? (
            <div className={styles.shippingOption}>
              <strong>{selectedShipping.name}</strong>
              <p>{selectedShipping.description}</p>
              <p>Estimated arrival: {selectedShipping.estimatedArrival}</p>
              <p>
                {selectedShipping.price === 0
                  ? "Free"
                  : formatMoney(selectedShipping.price)}
                {selectedShipping.trackingIncluded
                  ? " · Tracking included"
                  : ""}
              </p>
            </div>
          ) : null}
        </fieldset>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={billingSame}
            onChange={(event) => setBillingSame(event.target.checked)}
          />
          Billing address same as shipping
        </label>

        {!billingSame ? (
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Billing Address</legend>
            <div className={styles.grid}>
              <label className={styles.field}>
                Address
                <input name="billingLine1" autoComplete="billing address-line1" required />
              </label>
              <label className={styles.field}>
                Apartment or suite (optional)
                <input name="billingLine2" autoComplete="billing address-line2" />
              </label>
              <label className={styles.field}>
                City
                <input name="billingCity" autoComplete="billing address-level2" required />
              </label>
              <label className={styles.field}>
                Province
                <input name="billingProvince" autoComplete="billing address-level1" required />
              </label>
              <label className={styles.field}>
                Postal code
                <input name="billingPostalCode" autoComplete="billing postal-code" required inputMode="numeric" pattern="\d{4}" />
              </label>
              <label className={styles.field}>
                Country
                <input name="billingCountry" autoComplete="billing country-name" defaultValue="South Africa" required />
              </label>
            </div>
          </fieldset>
        ) : null}

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Payment</legend>
          <p className={styles.paymentNote}>
            Payment gateway connection is pending. This order will be held
            awaiting payment setup. No payment information is collected.
          </p>
        </fieldset>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className={styles.submit}
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Placing order…" : "Place Order"}
        </button>
      </div>

      <div className={styles.sidebar}>
        <h2>Order Summary</h2>
        <div className={styles.summaryLine}>
          <span>{productData.shortName}</span>
          <span>Size {line.size}</span>
          <span>× {line.quantity}</span>
          <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>Shipping</span>
          <strong>
            {(selectedShipping?.price ?? 0) === 0
              ? "Free"
              : formatMoney(selectedShipping?.price ?? 0)}
          </strong>
        </div>
        <div className={styles.totalRow}>
          <span>Total</span>
          <strong>{formatMoney(total)}</strong>
        </div>

        <div className={styles.trust}>
          <p>✓ Secure Checkout</p>
          <p>✓ Tracked Delivery</p>
          <p>✓ Size Exchanges Available</p>
        </div>
      </div>
    </form>
  );
}
