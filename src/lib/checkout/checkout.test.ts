import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  checkoutIdentitiesMatch,
  clientPriceIsAuthoritative,
  parseCartSnapshot,
  payEnabled,
  resolveCheckoutConfirmationLookup,
  shouldApplyCheckoutPreparation,
  shouldReusePaystackInitialization,
} from "./policy";
import {
  checkoutDetailsSchema,
  checkoutInputFromRequestBody,
  firstCheckoutInputName,
  flattenCheckoutFieldErrors,
} from "./schema";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const validDetails = {
  checkoutKey: "2c1a0b3e-7d64-4a11-9f2c-1b8e6d4c9a20",
  customer: {
    email: "buyer@example.com",
    firstName: "Ada",
    lastName: "Mokoena",
    phone: "0821234567",
  },
  shippingAddress: {
    line1: "12 Loop Street",
    suburb: "Gardens",
    city: "Cape Town",
    province: "Western Cape" as const,
    postalCode: "8001",
    country: "South Africa" as const,
  },
  billingSameAsShipping: true,
  shippingMethodId: "standard",
  colour: "Forest Green",
  size: "M",
  quantity: 1,
};

describe("checkout validation", () => {
  it("accepts a complete South African payload and ignores client prices", () => {
    const parsed = checkoutDetailsSchema.safeParse({
      ...validDetails,
      unitPrice: 1,
      total: 1,
    });
    assert.equal(parsed.success, true);
    assert.equal(clientPriceIsAuthoritative(), false);
    const stripped = checkoutInputFromRequestBody({
      ...validDetails,
      unitPrice: 1,
      total: 1,
      price: 1,
    }) as { unitPrice?: number; total?: number; price?: number };
    assert.equal(stripped.unitPrice, undefined);
    assert.equal(stripped.total, undefined);
    assert.equal(stripped.price, undefined);
  });

  it("rejects a missing province and focuses the first invalid field", () => {
    const parsed = checkoutDetailsSchema.safeParse({
      ...validDetails,
      customer: { ...validDetails.customer, email: "" },
      shippingAddress: { ...validDetails.shippingAddress, province: "" },
    });
    assert.equal(parsed.success, false);
    if (parsed.success) return;
    const fields = flattenCheckoutFieldErrors(parsed.error);
    assert.equal(firstCheckoutInputName(fields), "email");
  });
});

describe("checkout idempotency and Paystack reuse", () => {
  it("reuses a pending Paystack init when amount and email still match", () => {
    assert.equal(
      shouldReusePaystackInitialization({
        paymentStatus: "PENDING",
        amount: 799.99,
        orderTotal: 799.99,
        authorizationUrl: "https://paystack.test/redirect",
        providerReference: "PLEBS-1-abc",
        initializedEmail: "buyer@example.com",
        customerEmail: "buyer@example.com",
      }),
      true,
    );
    assert.equal(
      shouldReusePaystackInitialization({
        paymentStatus: "PENDING",
        amount: 799.99,
        orderTotal: 899.99,
        authorizationUrl: "https://paystack.test/redirect",
        providerReference: "PLEBS-1-abc",
      }),
      false,
    );
    assert.equal(
      checkoutIdentitiesMatch(
        {
          colour: "Forest Green",
          size: "M",
          quantity: 1,
          shippingMethodId: "standard",
          email: "a@example.com",
        },
        {
          colour: "Forest Green",
          size: "M",
          quantity: 1,
          shippingMethodId: "standard",
          email: "a@example.com",
        },
      ),
      true,
    );
  });

  it("gates Pay until payment is ready", () => {
    assert.equal(payEnabled("PREPARING", false), false);
    assert.equal(payEnabled("PAYMENT_READY", false), false);
    assert.equal(payEnabled("PAYMENT_READY", true), true);
  });

  it("ignores stale preparation when the customer has returned to details", () => {
    assert.equal(
      shouldApplyCheckoutPreparation({
        attempt: 1,
        latestAttempt: 2,
        view: "PREPARING",
      }),
      false,
    );
    assert.equal(
      shouldApplyCheckoutPreparation({
        attempt: 2,
        latestAttempt: 2,
        view: "DETAILS",
      }),
      false,
    );
    assert.equal(
      shouldApplyCheckoutPreparation({
        attempt: 2,
        latestAttempt: 2,
        view: "PREPARING",
      }),
      true,
    );
  });
});

describe("cart persistence", () => {
  it("restores a non-PII cart line and rejects address or token payloads", () => {
    const saved = parseCartSnapshot(
      JSON.stringify({
        colour: "Forest Green",
        size: "M",
        quantity: 1,
        sku: "PLB-D01-FGR-M",
        unitPrice: 799.99,
      }),
    );
    assert.equal(saved?.size, "M");
    assert.equal(
      parseCartSnapshot(
        JSON.stringify({
          colour: "Forest Green",
          size: "M",
          quantity: 1,
          unitPrice: 799.99,
          email: "secret@example.com",
        }),
      ),
      null,
    );
    assert.equal(
      parseCartSnapshot(
        JSON.stringify({
          colour: "Forest Green",
          size: "M",
          quantity: 1,
          unitPrice: 799.99,
          checkoutToken: "abc",
        }),
      ),
      null,
    );
  });
});

describe("checkout source contracts", () => {
  it("creates the pending order, reservation and customer in one transaction", () => {
    const orders = read("src/lib/orders.ts");
    assert.match(orders, /checkoutKey/);
    assert.match(orders, /db\.\$transaction/);
    assert.match(orders, /syncOrderReservationWithClient/);
    assert.match(orders, /upsertCustomerInTransaction/);
    assert.doesNotMatch(orders, /reserveStockForOrder\(/);
    assert.doesNotMatch(orders, /status: OrderStatus\.CANCELLED[\s\S]{0,80}out_of_stock/);
  });

  it("reuses a stored Paystack authorization_url instead of always initializing", () => {
    const paystack = read("src/lib/commerce/paystack.ts");
    assert.match(paystack, /getReusablePaystackRedirect/);
    assert.match(paystack, /reused: true/);
    assert.match(paystack, /initialized_email/);
  });

  it("keeps the cart until verified payment and does not wait on submit before review", () => {
    const form = read("src/components/checkout/CheckoutForm.tsx");
    const cart = read("src/components/cart/CartProvider.tsx");
    const beacon = read("src/components/analytics/PurchaseBeacon.tsx");
    const review = read("src/components/checkout/CheckoutReview.tsx");
    assert.match(form, /setUiState\("PREPARING"\)/);
    assert.match(form, /void prepareCheckout/);
    assert.doesNotMatch(form, /clearCart\(/);
    assert.doesNotMatch(form, /begin_checkout/);
    assert.match(form, /firstCheckoutInputName/);
    assert.match(cart, /sessionStorage/);
    assert.match(cart, /CART_STORAGE_KEY/);
    assert.match(beacon, /plebs:clear-cart/);
    assert.match(review, /location\.assign/);
    assert.match(review, /Edit details/);
    assert.match(review, /Cancel checkout/);
  });

  it("does not let account provisioning fail a paid order", () => {
    const fulfilment = read("src/lib/commerce/fulfilment-service.ts");
    assert.match(fulfilment, /provisionPaidOrderAccount/);
    assert.match(
      fulfilment,
      /try \{\s*await provisionPaidOrderAccount\(order\.id\);/,
    );
    assert.match(fulfilment, /FOR UPDATE/);
    assert.match(fulfilment, /settlePaidOrderReservationWithClient/);
  });

  it("uses an optimistic inventory version guard", () => {
    const reservation = read("src/lib/commerce/inventory-reservation.ts");
    assert.match(reservation, /version: level\.version/);
    assert.match(reservation, /version: \{ increment: 1 \}/);
    assert.match(reservation, /updateMany/);
    assert.match(reservation, /expireAbandonedReservations/);
    assert.match(reservation, /settlePaidOrderReservationWithClient/);
    assert.match(reservation, /claimAndReleaseOrphanReservation|updateMany/);
    assert.match(reservation, /claimed\.count !== 1/);
  });

  it("cancels only unpaid orders inside one locked transaction", () => {
    const orders = read("src/lib/orders.ts");
    assert.match(orders, /FOR UPDATE/);
    assert.match(orders, /releaseOrderReservationWithClient/);
    assert.match(orders, /paymentStatus: \{ not: PaymentStatus\.PAID \}/);
  });

  it("verifies paid confirmation from the checkout cookie, not the query string", () => {
    const confirmation = read("src/app/(site)/order-confirmation/page.tsx");
    assert.match(confirmation, /getCheckoutOrder/);
    assert.match(confirmation, /CHECKOUT_COOKIE_NAME/);
    assert.match(confirmation, /resolveCheckoutConfirmationLookup/);
    assert.doesNotMatch(confirmation, /params\.paid === "true"/);
    const form = read("src/components/checkout/CheckoutForm.tsx");
    assert.match(form, /shouldApplyCheckoutPreparation/);
    assert.match(form, /prepareAttemptRef/);
    assert.match(form, /introGroup/);
    assert.match(form, /\/account\/register\//);
  });

  it("does not let a newer checkout cookie steal an older Paystack callback", () => {
    const mismatched = resolveCheckoutConfirmationLookup({
      checkoutOrderNumber: "PLEBS-B",
      checkoutToken: "token-b",
      confirmationOrderNumber: "PLEBS-A",
      confirmationToken: "token-a",
      queryOrderNumber: "PLEBS-A",
    });
    assert.deepEqual(mismatched, {
      orderNumber: "PLEBS-A",
      checkoutToken: "token-a",
    });

    const matchingCookie = resolveCheckoutConfirmationLookup({
      checkoutOrderNumber: "PLEBS-A",
      checkoutToken: "token-a",
      queryOrderNumber: "PLEBS-A",
    });
    assert.deepEqual(matchingCookie, {
      orderNumber: "PLEBS-A",
      checkoutToken: "token-a",
    });

    const overwrittenCookie = resolveCheckoutConfirmationLookup({
      checkoutOrderNumber: "PLEBS-B",
      checkoutToken: "token-b",
      queryOrderNumber: "PLEBS-A",
    });
    assert.equal(overwrittenCookie, null);
  });

  it("keeps the Paystack confirmation token out of the redirect URL", () => {
    const callback = read("src/app/api/payments/paystack/callback/route.ts");
    assert.match(callback, /CONFIRMATION_COOKIE_NAME/);
    assert.match(callback, /confirmationCookieOptions/);
    assert.doesNotMatch(callback, /searchParams\.set\("token"/);
    assert.doesNotMatch(callback, /token=\$\{/);
    const confirmation = read("src/app/(site)/order-confirmation/page.tsx");
    assert.match(confirmation, /CONFIRMATION_COOKIE_NAME/);
    assert.doesNotMatch(confirmation, /params\.token/);
  });

  it("exposes a Vercel-callable GET cron on the integration-outbox route", () => {
    const outbox = read("src/app/api/cron/integration-outbox/route.ts");
    assert.match(outbox, /export const \{ GET, POST \}/);
    assert.match(outbox, /CRON_SECRET|cronHandlers/);
    assert.match(outbox, /maxDuration/);
    assert.match(outbox, /OUTBOX_CRON_BATCH/);
    const vercel = read("vercel.json");
    assert.match(vercel, /\/api\/cron\/integration-outbox\//);
    assert.match(vercel, /"schedule": "0 4 \* \* \*"/);
    assert.match(vercel, /"maxDuration": 300/);
    assert.doesNotMatch(
      vercel,
      /"path": "\/api\/cron\/expire-reservations/,
    );
    const authorize = read("src/lib/cron/authorize.ts");
    assert.match(authorize, /CRON_SECRET/);
    assert.match(authorize, /GET: handler/);
    const packed = read("src/lib/commerce/fulfilment-service.ts");
    assert.match(packed, /inventoryHold/);
    assert.match(packed, /resolveInventoryHold/);
    assert.match(packed, /Orders must be paid before packing/);
    const holdUi = read(
      "src/app/admin/(dashboard)/orders/[id]/OrderActionsPanel.tsx",
    );
    assert.match(holdUi, /Inventory hold — do not pack/);
    assert.match(holdUi, /Retry stock reservation/);
    const listing = read("src/lib/orders.ts");
    assert.match(listing, /inventoryHold: true/);
    assert.match(listing, /inventoryHold: false/);
  });
});
