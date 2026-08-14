import { NextResponse } from "next/server";
import {
  CHECKOUT_COOKIE_NAME,
  checkoutCookieOptions,
} from "@/lib/checkout/cookie";
import { cancelCheckoutOrder } from "@/lib/orders";

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

  try {
    const order = await cancelCheckoutOrder({
      orderId: body.orderId,
      checkoutToken: body.checkoutToken,
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found or already cancelled." },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      orderId: order.id,
      orderNumber: order.number,
      status: order.status,
    });
    response.cookies.set(CHECKOUT_COOKIE_NAME, "", {
      ...checkoutCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to cancel this order.",
      },
      { status: 400 },
    );
  }
}
