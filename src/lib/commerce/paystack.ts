import "server-only";

import { PaymentStatus } from "@/generated/prisma/client";
import { getCanonicalSiteUrl } from "@/lib/env";
import { markOrderPaid } from "@/lib/commerce/fulfilment-service";
import { db } from "@/lib/db";

const PAYSTACK_BASE = "https://api.paystack.co";

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

export function getPaystackPublicKey() {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || null;
}

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Paystack is not configured.");
  }
  return key;
}

async function paystackRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data: T;
  };

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || "Paystack request failed.");
  }

  return payload.data;
}

export async function initializePaystackPayment(orderId: string) {
  if (!isPaystackConfigured()) {
    return {
      ok: false as const,
      code: "not_configured" as const,
      message:
        "Payment gateway is not configured yet. Your order is reserved awaiting payment setup.",
    };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payments: true, items: true },
  });

  if (!order) {
    return {
      ok: false as const,
      code: "not_found" as const,
      message: "Order not found.",
    };
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    return {
      ok: false as const,
      code: "already_paid" as const,
      message: "This order is already paid.",
    };
  }

  const amountKobo = Math.round(Number(order.total) * 100);
  const callbackUrl = new URL(
    "/api/payments/paystack/callback/",
    getCanonicalSiteUrl(),
  ).toString();

  const data = await paystackRequest<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: order.customerEmail,
      amount: amountKobo,
      currency: order.currency,
      reference: `${order.number}-${Date.now().toString(36)}`,
      callback_url: callbackUrl,
      metadata: {
        order_id: order.id,
        order_number: order.number,
        custom_fields: [
          {
            display_name: "Order",
            variable_name: "order_number",
            value: order.number,
          },
        ],
      },
    }),
  });

  const pendingPayment =
    order.payments.find((payment) => payment.status === PaymentStatus.PENDING) ??
    order.payments[0];

  if (pendingPayment) {
    await db.payment.update({
      where: { id: pendingPayment.id },
      data: {
        provider: "paystack",
        providerReference: data.reference,
        status: PaymentStatus.PENDING,
        metadata: {
          access_code: data.access_code,
          authorization_url: data.authorization_url,
        },
      },
    });
  } else {
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: "paystack",
        providerReference: data.reference,
        status: PaymentStatus.PENDING,
        amount: order.total,
        currency: order.currency,
        metadata: {
          access_code: data.access_code,
          authorization_url: data.authorization_url,
        },
      },
    });
  }

  return {
    ok: true as const,
    authorizationUrl: data.authorization_url,
    reference: data.reference,
    orderNumber: order.number,
  };
}

export async function verifyPaystackPayment(reference: string) {
  const data = await paystackRequest<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    id: number;
    metadata?: { order_id?: string; order_number?: string };
    paid_at?: string;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  if (data.status !== "success") {
    return {
      ok: false as const,
      message: `Payment status is ${data.status}.`,
    };
  }

  const payment = await db.payment.findFirst({
    where: {
      OR: [
        { providerReference: reference },
        { providerReference: data.reference },
      ],
    },
    include: { order: true },
  });

  const orderId =
    payment?.orderId ??
    data.metadata?.order_id ??
    (
      await db.order.findFirst({
        where: { number: data.metadata?.order_number },
        select: { id: true },
      })
    )?.id;

  if (!orderId) {
    return {
      ok: false as const,
      message: "Unable to match Paystack payment to an order.",
    };
  }

  await markOrderPaid({
    orderId,
    provider: "paystack",
    providerReference: data.reference,
    providerEventId: `paystack-verify-${data.id}`,
    amount: data.amount / 100,
  });

  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { id: true, number: true },
  });

  return {
    ok: true as const,
    orderId: order.id,
    orderNumber: order.number,
  };
}

export async function handlePaystackWebhook(rawBody: string, signature: string | null) {
  const crypto = await import("node:crypto");
  const secret = getSecretKey();
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

  if (!signature || hash !== signature) {
    return { ok: false as const, status: 401, message: "Invalid signature." };
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data: {
      id: number;
      reference: string;
      amount: number;
      status: string;
      metadata?: { order_id?: string; order_number?: string };
    };
  };

  if (event.event !== "charge.success" || event.data.status !== "success") {
    return { ok: true as const, ignored: true };
  }

  const verified = await verifyPaystackPayment(event.data.reference);
  if (!verified.ok) {
    return { ok: false as const, status: 400, message: verified.message };
  }

  return { ok: true as const, orderNumber: verified.orderNumber };
}
