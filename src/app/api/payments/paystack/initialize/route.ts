import { NextResponse } from "next/server";
import { initializePaystackPayment, isPaystackConfigured } from "@/lib/commerce/paystack";

export async function POST(request: Request) {
  const body = (await request.json()) as { orderId?: string };
  if (!body.orderId) {
    return NextResponse.json({ message: "Missing orderId." }, { status: 400 });
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

  const result = await initializePaystackPayment(body.orderId);
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
  });
}
