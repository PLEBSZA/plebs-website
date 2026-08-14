export const CHECKOUT_COOKIE_NAME = "plebs_checkout";
export const CHECKOUT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;
export const CONFIRMATION_COOKIE_NAME = "plebs_confirmation";
export const CONFIRMATION_COOKIE_MAX_AGE_SECONDS = 60 * 15;

export function serializeCheckoutCookieValue(
  orderNumber: string,
  checkoutToken: string,
) {
  return `${orderNumber}.${checkoutToken}`;
}

export function parseCheckoutCookieValue(value: string | undefined | null) {
  if (!value) return null;
  const separator = value.indexOf(".");
  if (separator <= 0 || separator === value.length - 1) return null;
  return {
    orderNumber: value.slice(0, separator),
    checkoutToken: value.slice(separator + 1),
  };
}

export function checkoutCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CHECKOUT_COOKIE_MAX_AGE_SECONDS,
  };
}

export function confirmationCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CONFIRMATION_COOKIE_MAX_AGE_SECONDS,
  };
}
