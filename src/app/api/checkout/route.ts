import { NextResponse } from "next/server";
import {
  CHECKOUT_COOKIE_NAME,
  checkoutCookieOptions,
  serializeCheckoutCookieValue,
} from "@/lib/checkout/cookie";
import { checkoutInputFromRequestBody } from "@/lib/checkout/schema";
import {
  initializePaystackPayment,
  isPaystackConfigured,
} from "@/lib/commerce/paystack";
import { createOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const started = Date.now();
  const body = (await request.json()) as Record<string, unknown>;
  const input = checkoutInputFromRequestBody(body);

  const result = await createOrder(
    input as Parameters<typeof createOrder>[0],
  );
  const orderReadyMs = Date.now() - started;

  if (!result.ok) {
    const status =
      result.code === "out_of_stock" || result.code === "conflict" ? 409 : 400;
    const response = NextResponse.json(
      {
        message: result.message,
        code: result.code,
        fields: "fields" in result ? result.fields : undefined,
      },
      { status },
    );
    response.headers.set(
      "Server-Timing",
      `checkout_order_ready;dur=${orderReadyMs}`,
    );
    return response;
  }

  let paymentReady = false;
  let authorizationUrl: string | null = null;
  let paymentMessage: string | null = null;

  if (isPaystackConfigured()) {
    try {
      const payment = await initializePaystackPayment(
        result.order.id,
        new URL(request.url).origin,
      );
      if (payment.ok) {
        paymentReady = true;
        authorizationUrl = payment.authorizationUrl;
      } else {
        paymentMessage = payment.message;
      }
    } catch {
      paymentMessage =
        "Paystack could not be reached. You can retry payment from review.";
    }
  } else {
    paymentMessage =
      "Payment gateway is not configured yet. Your order has been reserved.";
  }

  const paymentReadyMs = Date.now() - started;
  const response = NextResponse.json({
    orderId: result.order.id,
    orderNumber: result.order.number,
    checkoutToken: result.checkoutToken,
    reused: result.reused,
    order: result.order,
    paymentReady,
    authorizationUrl,
    paymentMessage,
  });
  response.cookies.set(
    CHECKOUT_COOKIE_NAME,
    serializeCheckoutCookieValue(result.order.number, result.checkoutToken),
    checkoutCookieOptions(),
  );
  response.headers.set(
    "Server-Timing",
    `checkout_order_ready;dur=${orderReadyMs}, checkout_payment_ready;dur=${paymentReadyMs}`,
  );
  return response;
}
