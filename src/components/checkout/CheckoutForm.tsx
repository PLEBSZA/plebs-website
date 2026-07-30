"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import { shippingMethods } from "@/lib/shipping";
import { AddressAutocompleteInput } from "./AddressAutocompleteInput";
import styles from "./CheckoutForm.module.css";

type CheckoutFormProps = {
  paymentMode: "test" | "live" | "unconfigured";
};

export function CheckoutForm({ paymentMode }: CheckoutFormProps) {
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
          shippingSuburb: data.shippingSuburb,
          shippingCity: data.shippingCity,
          shippingProvince: data.shippingProvince,
          shippingPostalCode: data.shippingPostalCode,
          shippingCountry: data.shippingCountry || "South Africa",
          billingSameAsShipping: billingSame,
          billingLine1: billingSame ? undefined : data.billingLine1,
          billingLine2: billingSame ? undefined : data.billingLine2,
          billingSuburb: billingSame ? undefined : data.billingSuburb,
          billingCity: billingSame ? undefined : data.billingCity,
          billingProvince: billingSame ? undefined : data.billingProvince,
          billingPostalCode: billingSame ? undefined : data.billingPostalCode,
          billingCountry: billingSame
            ? undefined
            : data.billingCountry || "South Africa",
          shippingMethodId: selectedShipping?.id ?? "standard",
          colour: line.colour,
          size: line.size,
          quantity: line.quantity,
        }),
      });

      const result = (await response.json()) as {
        orderId?: string;
        orderNumber?: string;
        checkoutToken?: string;
        message?: string;
      };

      if (!response.ok || !result.orderNumber || !result.checkoutToken) {
        setStatus("error");
        setError(result.message ?? "Unable to save your order details.");
        return;
      }

      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: {
            event: "begin_checkout",
            selected_size: line.size,
            availability: "in_stock",
            variant_sku: line.sku,
            colour: line.colour,
            quantity: line.quantity,
          },
        }),
      );

      clearCart();
      router.push(
        `/checkout/review/?order=${encodeURIComponent(result.orderNumber)}&token=${encodeURIComponent(result.checkoutToken)}`,
      );
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.main}>
        <p className={styles.step}>Step 1 of 2 · Your details</p>
        <h1>Checkout</h1>
        <p className={styles.intro}>
          Enter your delivery details. You&apos;ll review everything and pay on
          the next step
          {paymentMode === "test"
            ? " (Paystack test mode)."
            : paymentMode === "live"
              ? " with Paystack."
              : "."}
        </p>

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
          <p className={styles.privacyNote}>
            We use these details to fulfil your order and send order updates.
            See the <Link href="/privacy-policy/">privacy policy</Link>.
          </p>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Shipping Address</legend>
          <div className={styles.grid}>
            <label className={styles.field}>
              Street address
              <AddressAutocompleteInput
                name="shippingLine1"
                autoComplete="address-line1"
                fieldPrefix="shipping"
                required
              />
            </label>
            <label className={styles.field}>
              Apartment or suite (optional)
              <input name="shippingLine2" autoComplete="address-line2" />
            </label>
            <label className={styles.field}>
              Suburb
              <input
                name="shippingSuburb"
                autoComplete="address-level3"
                required
              />
            </label>
            <label className={styles.field}>
              City
              <input
                name="shippingCity"
                autoComplete="address-level2"
                required
              />
            </label>
            <label className={styles.field}>
              Province
              <input
                name="shippingProvince"
                autoComplete="address-level1"
                required
              />
            </label>
            <label className={styles.field}>
              Postal code
              <input
                name="shippingPostalCode"
                autoComplete="postal-code"
                required
                inputMode="numeric"
                pattern="\d{4}"
              />
            </label>
            <label className={styles.field}>
              Country
              <input
                name="shippingCountry"
                autoComplete="country-name"
                defaultValue="South Africa"
                required
              />
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
                Street address
                <AddressAutocompleteInput
                  name="billingLine1"
                  autoComplete="billing address-line1"
                  fieldPrefix="billing"
                  required
                />
              </label>
              <label className={styles.field}>
                Apartment or suite (optional)
                <input
                  name="billingLine2"
                  autoComplete="billing address-line2"
                />
              </label>
              <label className={styles.field}>
                Suburb
                <input
                  name="billingSuburb"
                  autoComplete="billing address-level3"
                  required
                />
              </label>
              <label className={styles.field}>
                City
                <input
                  name="billingCity"
                  autoComplete="billing address-level2"
                  required
                />
              </label>
              <label className={styles.field}>
                Province
                <input
                  name="billingProvince"
                  autoComplete="billing address-level1"
                  required
                />
              </label>
              <label className={styles.field}>
                Postal code
                <input
                  name="billingPostalCode"
                  autoComplete="billing postal-code"
                  required
                  inputMode="numeric"
                  pattern="\d{4}"
                />
              </label>
              <label className={styles.field}>
                Country
                <input
                  name="billingCountry"
                  autoComplete="billing country-name"
                  defaultValue="South Africa"
                  required
                />
              </label>
            </div>
          </fieldset>
        ) : null}

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
          {status === "submitting" ? "Saving details…" : "Next"}
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
          <p>✓ Review before paying</p>
          <p>✓ Secure Paystack checkout</p>
          <p>✓ Tracked delivery</p>
        </div>
      </div>
    </form>
  );
}
