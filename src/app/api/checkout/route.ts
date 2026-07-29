import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import {
  initializePaystackPayment,
  isPaystackConfigured,
} from "@/lib/commerce/paystack";

export async function POST(request: Request) {
  const body = await request.json();

  const result = await createOrder({
    customer: {
      email: body.email ?? "",
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      phone: body.phone ?? "",
    },
    shippingAddress: {
      line1: body.shippingLine1 ?? "",
      line2: body.shippingLine2,
      city: body.shippingCity ?? "",
      province: body.shippingProvince ?? "",
      postalCode: body.shippingPostalCode ?? "",
      country: body.shippingCountry ?? "South Africa",
    },
    billingSameAsShipping: body.billingSameAsShipping !== false,
    billingAddress: body.billingSameAsShipping
      ? undefined
      : {
          line1: body.billingLine1 ?? "",
          line2: body.billingLine2,
          city: body.billingCity ?? "",
          province: body.billingProvince ?? "",
          postalCode: body.billingPostalCode ?? "",
          country: body.billingCountry ?? "South Africa",
        },
    shippingMethodId: body.shippingMethodId ?? "standard",
    colour: body.colour ?? "Forest Green",
    size: body.size ?? "",
    quantity: Number(body.quantity ?? 1),
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, code: result.code },
      { status: result.code === "out_of_stock" ? 409 : 400 },
    );
  }

  if (isPaystackConfigured()) {
    const payment = await initializePaystackPayment(result.order.id);
    if (payment.ok) {
      return NextResponse.json({
        orderId: result.order.id,
        orderNumber: result.order.number,
        paymentUrl: payment.authorizationUrl,
        paymentReference: payment.reference,
      });
    }
  }

  return NextResponse.json({
    orderId: result.order.id,
    orderNumber: result.order.number,
  });
}
