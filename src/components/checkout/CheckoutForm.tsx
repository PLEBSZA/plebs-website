"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  CHECKOUT_KEY_STORAGE,
  shouldApplyCheckoutPreparation,
  type CheckoutUiState,
} from "@/lib/checkout/policy";
import {
  checkoutStepHandoff,
  handoffCheckoutStepFocus,
} from "@/lib/checkout/step-handoff";
import { CONSENT_WORDING } from "@/lib/account/consent";
import {
  checkoutDetailsSchema,
  firstCheckoutInputName,
  flattenCheckoutFieldErrors,
  type CheckoutDetailsInput,
} from "@/lib/checkout/schema";
import { SOUTH_AFRICAN_PROVINCES } from "@/lib/checkout/provinces";
import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import { shippingMethods } from "@/lib/shipping";
import { AddressAutocompleteInput } from "./AddressAutocompleteInput";
import {
  CheckoutReview,
  type CheckoutReviewOrder,
} from "./CheckoutReview";
import styles from "./CheckoutForm.module.css";

export type CheckoutPrefill = {
  signedIn?: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingSuburb?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
};

type CheckoutFormProps = {
  paymentMode: "test" | "live" | "unconfigured";
  prefill?: CheckoutPrefill;
};

type PreparedCheckout = {
  order: CheckoutReviewOrder;
  checkoutToken: string;
  paymentReady: boolean;
  authorizationUrl: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getOrCreateCheckoutKey() {
  try {
    const existing = sessionStorage.getItem(CHECKOUT_KEY_STORAGE);
    if (existing && UUID_RE.test(existing)) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_KEY_STORAGE, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}

function stringField(data: Record<string, FormDataEntryValue>, name: string) {
  const value = data[name];
  return typeof value === "string" ? value : "";
}

function detailsFromForm(
  form: HTMLFormElement,
  input: {
    checkoutKey: string;
    billingSame: boolean;
    colour: string;
    size: string;
    quantity: number;
  },
) {
  const data = Object.fromEntries(new FormData(form));
  return {
    checkoutKey: input.checkoutKey,
    customer: {
      email: stringField(data, "email"),
      firstName: stringField(data, "firstName"),
      lastName: stringField(data, "lastName"),
      phone: stringField(data, "phone"),
    },
    shippingAddress: {
      line1: stringField(data, "shippingLine1"),
      line2: stringField(data, "shippingLine2") || undefined,
      suburb: stringField(data, "shippingSuburb"),
      city: stringField(data, "shippingCity"),
      province: stringField(data, "shippingProvince"),
      postalCode: stringField(data, "shippingPostalCode"),
      country: "South Africa" as const,
    },
    billingSameAsShipping: input.billingSame,
    billingAddress: input.billingSame
      ? undefined
      : {
          line1: stringField(data, "billingLine1"),
          line2: stringField(data, "billingLine2") || undefined,
          suburb: stringField(data, "billingSuburb"),
          city: stringField(data, "billingCity"),
          province: stringField(data, "billingProvince"),
          postalCode: stringField(data, "billingPostalCode"),
          country: "South Africa" as const,
        },
    shippingMethodId: shippingMethods[0]?.id ?? "standard",
    colour: input.colour,
    size: input.size,
    quantity: input.quantity,
  };
}

function optimisticOrder(input: {
  details: CheckoutDetailsInput;
  unitPrice: number;
  sku: string | null;
}): CheckoutReviewOrder {
  const shipping = shippingMethods[0];
  const subtotal = Number((input.unitPrice * input.details.quantity).toFixed(2));
  const shippingPrice = shipping?.price ?? 0;
  return {
    id: "",
    number: "Preparing",
    status: "preparing",
    customer: input.details.customer,
    shippingAddress: input.details.shippingAddress,
    billingSameAsShipping: input.details.billingSameAsShipping,
    shippingMethodId: input.details.shippingMethodId,
    shippingPrice,
    line: {
      productName: productData.shortName,
      colour: input.details.colour,
      size: input.details.size,
      quantity: input.details.quantity,
      unitPrice: input.unitPrice,
      sku: input.sku,
    },
    subtotal,
    total: Number((subtotal + shippingPrice).toFixed(2)),
    currency: "ZAR",
  };
}

function fillEmptyFields(form: HTMLFormElement, prefill: CheckoutPrefill) {
  const entries: Array<[string, string | undefined]> = [
    ["email", prefill.email],
    ["firstName", prefill.firstName],
    ["lastName", prefill.lastName],
    ["phone", prefill.phone],
    ["shippingLine1", prefill.shippingLine1],
    ["shippingLine2", prefill.shippingLine2],
    ["shippingSuburb", prefill.shippingSuburb],
    ["shippingCity", prefill.shippingCity],
    ["shippingProvince", prefill.shippingProvince],
    ["shippingPostalCode", prefill.shippingPostalCode],
  ];
  for (const [name, value] of entries) {
    if (!value) continue;
    const element = form.elements.namedItem(name);
    if (
      (element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement) &&
      !element.value
    ) {
      element.value = value;
    }
  }
}

export function CheckoutForm({ paymentMode, prefill }: CheckoutFormProps) {
  const router = useRouter();
  const { line, subtotal } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const detailsIntroRef = useRef<HTMLDivElement>(null);
  const detailsHeadingRef = useRef<HTMLHeadingElement>(null);
  const reviewCardRef = useRef<HTMLElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingHandoffRef = useRef<ReturnType<typeof checkoutStepHandoff>>(null);
  const checkoutKeyRef = useRef<string>("");
  const lastDetailsRef = useRef<CheckoutDetailsInput | null>(null);
  const reviewStartedRef = useRef(0);
  const prepareAttemptRef = useRef(0);
  const uiStateRef = useRef<CheckoutUiState>("DETAILS");
  const [billingSame, setBillingSame] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uiState, setUiState] = useState<CheckoutUiState>("DETAILS");
  const [optimistic, setOptimistic] = useState<CheckoutReviewOrder | null>(
    null,
  );
  const [prepared, setPrepared] = useState<PreparedCheckout | null>(null);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const [accountPrefill, setAccountPrefill] = useState<CheckoutPrefill | undefined>(
    prefill,
  );

  const selectedShipping = shippingMethods[0];
  const total = subtotal + (selectedShipping?.price ?? 0);
  uiStateRef.current = uiState;

  function transitionUi(next: CheckoutUiState) {
    const handoff = checkoutStepHandoff(uiStateRef.current, next);
    if (handoff) pendingHandoffRef.current = handoff;
    uiStateRef.current = next;
    setUiState(next);
  }

  useLayoutEffect(() => {
    const step = pendingHandoffRef.current;
    if (!step) return;
    pendingHandoffRef.current = null;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    handoffCheckoutStepFocus({
      scrollTarget:
        step === "review" ? reviewCardRef.current : detailsIntroRef.current,
      focusTarget:
        step === "review"
          ? reviewHeadingRef.current
          : detailsHeadingRef.current,
      prefersReducedMotion,
    });
  }, [uiState]);

  useEffect(() => {
    checkoutKeyRef.current = getOrCreateCheckoutKey();
  }, []);

  useEffect(() => {
    function onPrefill(event: Event) {
      const detail = (event as CustomEvent<CheckoutPrefill>).detail;
      setAccountPrefill((current) => ({ ...current, ...detail }));
      if (formRef.current) fillEmptyFields(formRef.current, detail);
    }
    window.addEventListener("plebs:checkout-prefill", onPrefill);
    return () => window.removeEventListener("plebs:checkout-prefill", onPrefill);
  }, []);

  useEffect(() => {
    if (!accountPrefill || !formRef.current) return;
    fillEmptyFields(formRef.current, accountPrefill);
  }, [accountPrefill]);

  async function prepareCheckout(
    details: CheckoutDetailsInput,
    reviewOrder: CheckoutReviewOrder,
    attempt: number,
  ) {
    const orderStarted = performance.now();
    try {
      const response = await fetch("/api/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const result = (await response.json()) as {
        order?: CheckoutReviewOrder;
        checkoutToken?: string;
        paymentReady?: boolean;
        authorizationUrl?: string | null;
        paymentMessage?: string | null;
        message?: string;
        fields?: Record<string, string>;
      };

      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: {
            event: "checkout_order_ready_ms",
            value: String(Math.round(performance.now() - orderStarted)),
          },
        }),
      );

      const applyView = shouldApplyCheckoutPreparation({
        attempt,
        latestAttempt: prepareAttemptRef.current,
        view: uiStateRef.current,
      });

      if (!response.ok || !result.order || !result.checkoutToken) {
        if (!applyView) return;
        transitionUi("PREPARATION_ERROR");
        setPreparationError(
          result.message ?? "Unable to reserve this order. You can edit details and try again.",
        );
        if (result.fields) setFieldErrors(result.fields);
        return;
      }

      router.prefetch(
        `/checkout/review/?order=${encodeURIComponent(result.order.number)}`,
      );

      const next: PreparedCheckout = {
        order: {
          ...result.order,
          status: result.order.status === "cancelled" ? "cancelled" : "awaiting_payment",
        },
        checkoutToken: result.checkoutToken,
        paymentReady: Boolean(result.paymentReady && result.authorizationUrl),
        authorizationUrl: result.authorizationUrl ?? null,
      };
      if (attempt !== prepareAttemptRef.current) return;
      setPrepared(next);
      if (!applyView) return;
      if (next.paymentReady) {
        transitionUi("PAYMENT_READY");
        setPreparationError(result.paymentMessage ?? null);
        window.dispatchEvent(
          new CustomEvent("plebs:commerce-event", {
            detail: {
              event: "checkout_payment_ready_ms",
              value: String(Math.round(performance.now() - reviewStartedRef.current)),
            },
          }),
        );
      } else {
        transitionUi("PREPARATION_ERROR");
        setPreparationError(
          result.paymentMessage ??
            "Your order is reserved, but payment is not ready yet.",
        );
      }
    } catch {
      if (
        !shouldApplyCheckoutPreparation({
          attempt,
          latestAttempt: prepareAttemptRef.current,
          view: uiStateRef.current,
        })
      ) {
        return;
      }
      setOptimistic(reviewOrder);
      transitionUi("PREPARATION_ERROR");
      setPreparationError("Something went wrong while reserving your order.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!line) return;

    const details = detailsFromForm(event.currentTarget, {
      checkoutKey: checkoutKeyRef.current || getOrCreateCheckoutKey(),
      billingSame,
      colour: line.colour,
      size: line.size,
      quantity: line.quantity,
    });
    checkoutKeyRef.current = details.checkoutKey;

    const parsed = checkoutDetailsSchema.safeParse(details);
    if (!parsed.success) {
      const fields = flattenCheckoutFieldErrors(parsed.error);
      setFieldErrors(fields);
      const inputName = firstCheckoutInputName(fields);
      const invalid = inputName
        ? event.currentTarget.elements.namedItem(inputName)
        : null;
      if (
        invalid instanceof HTMLInputElement ||
        invalid instanceof HTMLSelectElement
      ) {
        invalid.focus();
      }
      return;
    }

    setFieldErrors({});
    const reviewOrder = optimisticOrder({
      details: parsed.data,
      unitPrice: line.unitPrice,
      sku: line.sku,
    });
    lastDetailsRef.current = parsed.data;
    reviewStartedRef.current = performance.now();
    const attempt = prepareAttemptRef.current + 1;
    prepareAttemptRef.current = attempt;
    setOptimistic(reviewOrder);
    setPrepared(null);
    setPreparationError(null);
    transitionUi("PREPARING");
    window.dispatchEvent(
      new CustomEvent("plebs:commerce-event", {
        detail: {
          event: "checkout_ui_to_review_ms",
          value: String(Math.round(performance.now() - reviewStartedRef.current)),
        },
      }),
    );
    void prepareCheckout(parsed.data, reviewOrder, attempt);
  }

  if (!line) {
    return (
      <div className={styles.empty}>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link href={productData.path}>Shop the Dungarees</Link>
      </div>
    );
  }

  const showReview = uiState !== "DETAILS" && Boolean(optimistic || prepared);
  const reviewOrder = prepared?.order ?? optimistic;

  return (
    <>
      {showReview && reviewOrder ? (
        <CheckoutReview
          order={reviewOrder}
          checkoutToken={prepared?.checkoutToken}
          paymentMode={paymentMode}
          uiState={uiState}
          paymentReady={prepared?.paymentReady ?? false}
          authorizationUrl={prepared?.authorizationUrl}
          preparationError={preparationError}
          headingRef={reviewHeadingRef}
          cardRef={reviewCardRef}
          onEdit={() => {
            prepareAttemptRef.current += 1;
            setPreparationError(null);
            transitionUi("DETAILS");
          }}
          onRetryPrepare={() => {
            if (!lastDetailsRef.current || !line) {
              transitionUi("DETAILS");
              return;
            }
            const attempt = prepareAttemptRef.current + 1;
            prepareAttemptRef.current = attempt;
            setPreparationError(null);
            transitionUi("PREPARING");
            void prepareCheckout(
              lastDetailsRef.current,
              optimisticOrder({
                details: lastDetailsRef.current,
                unitPrice: line.unitPrice,
                sku: line.sku,
              }),
              attempt,
            );
          }}
        />
      ) : null}

    <form
      ref={formRef}
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      hidden={showReview}
    >
      <div className={styles.main}>
        <div className={styles.introGroup} ref={detailsIntroRef}>
          <p className={styles.step}>Step 1 of 2 · Your details</p>
          <h1 tabIndex={-1} ref={detailsHeadingRef}>
            Checkout
          </h1>
          <p className={styles.intro}>
            Enter your delivery details, then review your order. Payment stays
            locked until the item is reserved
            {paymentMode === "test"
              ? " (Paystack test mode)."
              : paymentMode === "live"
                ? " with Paystack."
                : "."}
          </p>
          {accountPrefill?.signedIn ? (
            <p className={styles.accountHook}>
              Signed in as {accountPrefill.email}. Saved details are filled where we
              have them.
            </p>
          ) : (
            <p className={styles.accountHook}>
              Already have an account?{" "}
              <Link href="/account/login/?callbackUrl=/checkout/">Sign in</Link>
              {" · "}
              <Link href="/account/register/?callbackUrl=/checkout/">
                Create account
              </Link>
            </p>
          )}
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Customer Information</legend>
          <div className={styles.grid}>
            <label className={`${styles.field} ${styles.pair}`}>
              First name
              <input name="firstName" autoComplete="given-name" required />
              {fieldErrors["customer.firstName"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["customer.firstName"]}
                </span>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.pair}`}>
              Last name
              <input name="lastName" autoComplete="family-name" required />
              {fieldErrors["customer.lastName"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["customer.lastName"]}
                </span>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.pair}`}>
              Email
              <input type="email" name="email" autoComplete="email" required />
              {fieldErrors["customer.email"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["customer.email"]}
                </span>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.pair}`}>
              Phone
              <input type="tel" name="phone" autoComplete="tel" required />
              {fieldErrors["customer.phone"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["customer.phone"]}
                </span>
              ) : null}
            </label>
          </div>
          <p className={styles.privacyNote}>
            {CONSENT_WORDING.CHECKOUT_ACCOUNT_NOTICE.text.replace(
              " See the privacy policy.",
              "",
            )}{" "}
            See the <Link href="/privacy-policy/">privacy policy</Link>.
          </p>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Shipping Address</legend>
          <div className={styles.grid}>
            <label className={`${styles.field} ${styles.full}`}>
              Street address
              <AddressAutocompleteInput
                name="shippingLine1"
                autoComplete="address-line1"
                fieldPrefix="shipping"
                required
              />
              {fieldErrors["shippingAddress.line1"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["shippingAddress.line1"]}
                </span>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.full}`}>
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
              {fieldErrors["shippingAddress.suburb"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["shippingAddress.suburb"]}
                </span>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.pair}`}>
              City
              <input
                name="shippingCity"
                autoComplete="address-level2"
                required
              />
              {fieldErrors["shippingAddress.city"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["shippingAddress.city"]}
                </span>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.pair}`}>
              Province
              <select
                name="shippingProvince"
                autoComplete="address-level1"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select province
                </option>
                {SOUTH_AFRICAN_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              {fieldErrors["shippingAddress.province"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["shippingAddress.province"]}
                </span>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.pair}`}>
              Postal code
              <input
                name="shippingPostalCode"
                autoComplete="postal-code"
                required
                inputMode="numeric"
                pattern="\d{4}"
              />
              {fieldErrors["shippingAddress.postalCode"] ? (
                <span className={styles.fieldError}>
                  {fieldErrors["shippingAddress.postalCode"]}
                </span>
              ) : null}
            </label>
            <input type="hidden" name="shippingCountry" value="South Africa" />
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Shipping</legend>
          {selectedShipping ? (
            <div className={styles.shippingOption}>
              <strong>Free tracked delivery in South Africa</strong>
              <p>{selectedShipping.description}</p>
              <p>Estimated arrival: {selectedShipping.estimatedArrival}</p>
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
              <label className={`${styles.field} ${styles.full}`}>
                Street address
                <AddressAutocompleteInput
                  name="billingLine1"
                  autoComplete="billing address-line1"
                  fieldPrefix="billing"
                  required
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
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
              <label className={`${styles.field} ${styles.pair}`}>
                City
                <input
                  name="billingCity"
                  autoComplete="billing address-level2"
                  required
                />
              </label>
              <label className={`${styles.field} ${styles.pair}`}>
                Province
                <select
                  name="billingProvince"
                  autoComplete="billing address-level1"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select province
                  </option>
                  {SOUTH_AFRICAN_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${styles.field} ${styles.pair}`}>
                Postal code
                <input
                  name="billingPostalCode"
                  autoComplete="billing postal-code"
                  required
                  inputMode="numeric"
                  pattern="\d{4}"
                />
              </label>
              <input type="hidden" name="billingCountry" value="South Africa" />
            </div>
          </fieldset>
        ) : null}

        <div className={styles.stickyBar}>
          <button type="submit" className={styles.submit}>
            Review order
          </button>
        </div>
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
          <span>Delivery</span>
          <strong>
            {(selectedShipping?.price ?? 0) === 0
              ? "Free tracked delivery in South Africa"
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
          <p>✓ Free tracked delivery in South Africa</p>
        </div>
      </div>
    </form>
    </>
  );
}
