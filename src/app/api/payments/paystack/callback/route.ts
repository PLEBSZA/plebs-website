import { NextResponse } from "next/server";
import {
  CONFIRMATION_COOKIE_NAME,
  confirmationCookieOptions,
  serializeCheckoutCookieValue,
} from "@/lib/checkout/cookie";
import { verifyPaystackPayment, isPaystackConfigured } from "@/lib/commerce/paystack";
import { rewriteLoopbackToPublicUrl } from "@/lib/env";

export async function GET(request: Request) {
  const requestUrl = rewriteLoopbackToPublicUrl(new URL(request.url));
  const reference =
    requestUrl.searchParams.get("reference") ??
    requestUrl.searchParams.get("trxref");

  if (!reference || !isPaystackConfigured()) {
    return NextResponse.redirect(
      new URL("/order-confirmation/?error=missing_reference", requestUrl.origin),
    );
  }

  const destination = new URL("/order-confirmation/", requestUrl.origin);
  destination.searchParams.set("error", "payment_failed");
  let checkoutToken: string | null = null;
  let orderNumber: string | null = null;

  try {
    const result = await verifyPaystackPayment(reference);
    if (result.ok) {
      destination.searchParams.delete("error");
      destination.searchParams.set("order", result.orderNumber);
      orderNumber = result.orderNumber;
      checkoutToken = result.checkoutToken;
    }
  } catch {
    // Keep the generic failure destination. Payment details stay server-side.
  }

  const response = NextResponse.redirect(destination);
  if (orderNumber && checkoutToken) {
    response.cookies.set(
      CONFIRMATION_COOKIE_NAME,
      serializeCheckoutCookieValue(orderNumber, checkoutToken),
      confirmationCookieOptions(),
    );
  }
  return response;
}
