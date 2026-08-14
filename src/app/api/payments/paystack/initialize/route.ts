import { NextResponse } from "next/server";
import {
  initializePaystackPayment,
  isPaystackConfigured,
} from "@/lib/commerce/paystack";
import { assertCheckoutAccess } from "@/lib/orders";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
    checkoutToken?: string;
  };

  if (!body.orderId || !body.checkoutToken) {
    return NextResponse.json(
      { message: "Missing order access details." },
      { status: 400 },
    );
  }

  const order = await assertCheckoutAccess({
    orderId: body.orderId,
    checkoutToken: body.checkoutToken,
  });

  if (!order) {
    return NextResponse.json(
      { message: "Order not found or access denied." },
      { status: 404 },
    );
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json(
      { message: "This order has been cancelled.", code: "cancelled" },
      { status: 409 },
    );
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      {
        message:
          "Payment gateway is not configured yet. Your order has been reserved.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  try {
    const result = await initializePaystackPayment(
      body.orderId,
      new URL(request.url).origin,
    );
    if (!result.ok) {
      return NextResponse.json(
        { message: result.message, code: result.code },
        { status: 400 },
      );
    }

    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
      orderNumber: result.orderNumber,
      reused: result.reused,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Paystack could not be reached. Try payment again.",
        code: "payment_initialization_failed",
      },
      { status: 502 },
    );
  }
}
