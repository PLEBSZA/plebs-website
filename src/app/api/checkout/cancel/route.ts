import { NextResponse } from "next/server";
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

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.number,
      status: order.status,
    });
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
