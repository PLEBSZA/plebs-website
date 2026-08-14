import type { PaymentStatus } from "@/generated/prisma/client";

export type CheckoutUiState =
  | "DETAILS"
  | "PREPARING"
  | "PAYMENT_READY"
  | "PREPARATION_ERROR"
  | "PAYMENT_OPENING";

export type CheckoutIdentity = {
  colour: string;
  size: string;
  quantity: number;
  shippingMethodId: string;
  email: string;
};

export function checkoutIdentitiesMatch(
  left: CheckoutIdentity,
  right: CheckoutIdentity,
): boolean {
  return (
    left.colour === right.colour &&
    left.size === right.size &&
    left.quantity === right.quantity &&
    left.shippingMethodId === right.shippingMethodId &&
    left.email === right.email
  );
}

export function shouldReusePaystackInitialization(input: {
  paymentStatus: PaymentStatus | string;
  amount: number;
  orderTotal: number;
  authorizationUrl?: string | null;
  providerReference?: string | null;
  initializedEmail?: string | null;
  customerEmail?: string | null;
}): boolean {
  if (input.paymentStatus !== "PENDING") return false;
  if (Math.round(input.amount * 100) !== Math.round(input.orderTotal * 100)) {
    return false;
  }
  if (
    input.initializedEmail &&
    input.customerEmail &&
    input.initializedEmail !== input.customerEmail
  ) {
    return false;
  }
  return Boolean(input.authorizationUrl && input.providerReference);
}

export function payEnabled(state: CheckoutUiState, paymentReady: boolean) {
  return state === "PAYMENT_READY" && paymentReady;
}

export function shouldApplyCheckoutPreparation(input: {
  attempt: number;
  latestAttempt: number;
  view: CheckoutUiState;
}): boolean {
  if (input.attempt !== input.latestAttempt) return false;
  return input.view !== "DETAILS";
}

export function clientPriceIsAuthoritative(): false {
  return false;
}

export type CartSnapshot = {
  colour: string;
  size: string;
  quantity: number;
  sku: string | null;
  unitPrice: number;
  variantId?: string;
};

export function resolveCheckoutConfirmationLookup(input: {
  checkoutOrderNumber?: string | null;
  checkoutToken?: string | null;
  confirmationOrderNumber?: string | null;
  confirmationToken?: string | null;
  queryOrderNumber?: string | null;
}): { orderNumber: string; checkoutToken: string } | null {
  const queryOrder = input.queryOrderNumber?.trim() || null;
  const confirmationOrder = input.confirmationOrderNumber?.trim() || null;
  const confirmationToken = input.confirmationToken?.trim() || null;
  const checkoutOrder = input.checkoutOrderNumber?.trim() || null;
  const checkoutToken = input.checkoutToken?.trim() || null;

  if (queryOrder) {
    if (confirmationOrder === queryOrder && confirmationToken) {
      return { orderNumber: queryOrder, checkoutToken: confirmationToken };
    }
    if (checkoutOrder === queryOrder && checkoutToken) {
      return { orderNumber: queryOrder, checkoutToken };
    }
    return null;
  }

  if (confirmationOrder && confirmationToken) {
    return { orderNumber: confirmationOrder, checkoutToken: confirmationToken };
  }

  if (checkoutOrder && checkoutToken) {
    return { orderNumber: checkoutOrder, checkoutToken };
  }

  return null;
}

export const CART_STORAGE_KEY = "plebs:cart-line";
export const CHECKOUT_KEY_STORAGE = "plebs:checkout-key";

export function parseCartSnapshot(value: string | null): CartSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<CartSnapshot>;
    if (
      typeof parsed.colour !== "string" ||
      typeof parsed.size !== "string" ||
      typeof parsed.quantity !== "number" ||
      typeof parsed.unitPrice !== "number" ||
      "email" in parsed ||
      "token" in parsed ||
      "checkoutToken" in parsed ||
      "shippingAddress" in parsed
    ) {
      return null;
    }
    return {
      colour: parsed.colour,
      size: parsed.size,
      quantity: parsed.quantity,
      sku: parsed.sku ?? null,
      unitPrice: parsed.unitPrice,
      variantId: parsed.variantId,
    };
  } catch {
    return null;
  }
}
