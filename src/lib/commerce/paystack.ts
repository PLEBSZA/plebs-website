import "server-only";

import { PaymentStatus } from "@/generated/prisma/client";
import { shouldReusePaystackInitialization } from "@/lib/checkout/policy";
import { getCanonicalSiteUrl } from "@/lib/env";
import { markOrderPaid } from "@/lib/commerce/fulfilment-service";
import { db } from "@/lib/db";

const PAYSTACK_BASE = "https://api.paystack.co";

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

export function getPaystackMode() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) return "unconfigured" as const;
  return key.startsWith("sk_test_") ? ("test" as const) : ("live" as const);
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

type PaystackPaymentMetadata = {
  authorization_url?: string;
  access_code?: string;
  initialized_email?: string;
  checkoutToken?: string;
};

function readPaystackMetadata(metadata: unknown): PaystackPaymentMetadata {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as PaystackPaymentMetadata;
}

export function getReusablePaystackRedirect(order: {
  paymentStatus: PaymentStatus;
  customerEmail: string;
  total: { toString(): string } | number;
  payments: Array<{
    status: PaymentStatus;
    amount: { toString(): string } | number;
    providerReference: string | null;
    metadata: unknown;
  }>;
}) {
  const pendingPayment =
    order.payments.find((payment) => payment.status === PaymentStatus.PENDING) ??
    order.payments[0];
  if (!pendingPayment) return null;

  const metadata = readPaystackMetadata(pendingPayment.metadata);
  if (
    !shouldReusePaystackInitialization({
      paymentStatus: pendingPayment.status,
      amount: Number(pendingPayment.amount),
      orderTotal: Number(order.total),
      authorizationUrl: metadata.authorization_url,
      providerReference: pendingPayment.providerReference,
      initializedEmail: metadata.initialized_email,
      customerEmail: order.customerEmail,
    })
  ) {
    return null;
  }

  return {
    authorizationUrl: metadata.authorization_url as string,
    reference: pendingPayment.providerReference as string,
  };
}

export async function initializePaystackPayment(
  orderId: string,
  requestOrigin?: string,
) {
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

  const reused = getReusablePaystackRedirect(order);
  if (reused) {
    return {
      ok: true as const,
      authorizationUrl: reused.authorizationUrl,
      reference: reused.reference,
      orderNumber: order.number,
      reused: true,
    };
  }

  const amountSubunit = Math.round(Number(order.total) * 100);
  const callbackBaseUrl =
    process.env.NODE_ENV === "development" && requestOrigin
      ? requestOrigin
      : getCanonicalSiteUrl();
  const callbackUrl = new URL(
    "/api/payments/paystack/callback/",
    callbackBaseUrl,
  ).toString();

  const pendingPayment =
    order.payments.find((payment) => payment.status === PaymentStatus.PENDING) ??
    order.payments[0];
  const existingMetadata =
    pendingPayment?.metadata && typeof pendingPayment.metadata === "object"
      ? (pendingPayment.metadata as Record<string, unknown>)
      : {};

  const data = await paystackRequest<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: order.customerEmail,
      amount: amountSubunit,
      currency: order.currency,
      reference: `${order.number}-${Date.now().toString(36)}`,
      callback_url: callbackUrl,
      metadata: {
        order_id: order.id,
        order_number: order.number,
        checkoutToken:
          typeof existingMetadata.checkoutToken === "string"
            ? existingMetadata.checkoutToken
            : undefined,
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

  if (pendingPayment) {
    await db.payment.update({
      where: { id: pendingPayment.id },
      data: {
        provider: "paystack",
        providerReference: data.reference,
        status: PaymentStatus.PENDING,
        metadata: {
          ...existingMetadata,
          access_code: data.access_code,
          authorization_url: data.authorization_url,
          initialized_email: order.customerEmail,
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
          initialized_email: order.customerEmail,
        },
      },
    });
  }

  return {
    ok: true as const,
    authorizationUrl: data.authorization_url,
    reference: data.reference,
    orderNumber: order.number,
    reused: false,
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

  const order =
    payment?.order ??
    (data.metadata?.order_id
      ? await db.order.findUnique({ where: { id: data.metadata.order_id } })
      : data.metadata?.order_number
        ? await db.order.findFirst({
            where: { number: data.metadata.order_number },
          })
        : null);

  if (!order) {
    return {
      ok: false as const,
      message: "Unable to match Paystack payment to an order.",
    };
  }

  const expectedAmount = Math.round(Number(order.total) * 100);
  if (data.amount !== expectedAmount || data.currency !== order.currency) {
    return {
      ok: false as const,
      message: "Paystack payment amount or currency does not match the order.",
    };
  }

  if (
    data.metadata?.order_id &&
    payment?.orderId &&
    data.metadata.order_id !== payment.orderId
  ) {
    return {
      ok: false as const,
      message: "Paystack payment metadata does not match the order.",
    };
  }

  await markOrderPaid({
    orderId: order.id,
    provider: "paystack",
    providerReference: data.reference,
    providerEventId: `paystack-verify-${data.id}`,
    amount: data.amount / 100,
  });

  const paidOrder = await db.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { payments: true },
  });
  const checkoutToken = paidOrder.payments
    .map((entry) => readPaystackMetadata(entry.metadata).checkoutToken)
    .find((value): value is string => Boolean(value));

  return {
    ok: true as const,
    orderId: paidOrder.id,
    orderNumber: paidOrder.number,
    checkoutToken: checkoutToken ?? null,
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
