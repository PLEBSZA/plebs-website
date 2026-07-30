import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  FulfilmentStatus,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  releaseOrderReservation,
  reserveStockForOrder,
  validatePurchaseQuantity,
} from "@/lib/commerce/inventory-reservation";
import { getShippingMethod } from "@/lib/shipping";

type CheckoutPaymentMetadata = {
  checkoutToken?: string;
};

function createCheckoutToken() {
  return randomBytes(24).toString("hex");
}

function tokensMatch(expected: string | undefined, provided: string | undefined) {
  if (!expected || !provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function readCheckoutToken(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return undefined;
  return (metadata as CheckoutPaymentMetadata).checkoutToken;
}

export type OrderAddress = {
  line1: string;
  line2?: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

export type CreateOrderInput = {
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  billingSameAsShipping: boolean;
  shippingMethodId: string;
  colour: string;
  size: string;
  quantity: number;
};

function createOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.floor(Math.random() * 900 + 100).toString();
  return `PLEBS-${stamp}-${suffix}`;
}

function requireText(value: string | undefined, label: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return email.trim().toLowerCase();
}

function validatePostalCode(postalCode: string) {
  if (!/^\d{4}$/.test(postalCode.trim())) {
    throw new Error("Enter a valid 4-digit South African postal code.");
  }
  return postalCode.trim();
}

export async function createOrder(input: CreateOrderInput) {
  try {
    const customer = {
      email: validateEmail(requireText(input.customer.email, "Email")),
      firstName: requireText(input.customer.firstName, "First name"),
      lastName: requireText(input.customer.lastName, "Last name"),
      phone: requireText(input.customer.phone, "Phone"),
    };

    const shippingAddress = {
      line1: requireText(input.shippingAddress.line1, "Address"),
      line2: input.shippingAddress.line2?.trim() || undefined,
      suburb: requireText(input.shippingAddress.suburb, "Suburb"),
      city: requireText(input.shippingAddress.city, "City"),
      province: requireText(input.shippingAddress.province, "Province"),
      postalCode: validatePostalCode(
        requireText(input.shippingAddress.postalCode, "Postal code"),
      ),
      country: requireText(input.shippingAddress.country, "Country"),
    };

    const billingAddress = input.billingSameAsShipping
      ? shippingAddress
      : {
          line1: requireText(input.billingAddress?.line1, "Billing address"),
          line2: input.billingAddress?.line2?.trim() || undefined,
          suburb: requireText(input.billingAddress?.suburb, "Billing suburb"),
          city: requireText(input.billingAddress?.city, "Billing city"),
          province: requireText(
            input.billingAddress?.province,
            "Billing province",
          ),
          postalCode: validatePostalCode(
            requireText(input.billingAddress?.postalCode, "Billing postal code"),
          ),
          country: requireText(
            input.billingAddress?.country,
            "Billing country",
          ),
        };

    const shipping = getShippingMethod(input.shippingMethodId);
    if (!shipping) {
      return {
        ok: false as const,
        code: "validation" as const,
        message: "Select a delivery method.",
      };
    }

    const stock = await validatePurchaseQuantity({
      colour: input.colour,
      size: input.size,
      quantity: input.quantity,
    });

    if (!stock.ok || !stock.variant) {
      return {
        ok: false as const,
        code: "out_of_stock" as const,
        message: stock.message,
      };
    }

    const unitPrice = stock.variant.retailPrice;
    const subtotal = Number((unitPrice * input.quantity).toFixed(2));
    const total = Number((subtotal + shipping.price).toFixed(2));
    const customerName = `${customer.firstName} ${customer.lastName}`;

    const dbCustomer = await db.customer.upsert({
      where: { email: customer.email },
      update: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
      create: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
    });

    const variantRecord = await db.productVariant.findUniqueOrThrow({
      where: { id: stock.variant.id },
      select: { productId: true },
    });

    const checkoutToken = createCheckoutToken();
    const order = await db.order.create({
      data: {
        number: createOrderNumber(),
        customerId: dbCustomer.id,
        customerEmail: customer.email,
        customerName,
        customerPhone: customer.phone,
        shippingAddress,
        billingAddress,
        paymentStatus: PaymentStatus.PENDING,
        fulfilmentStatus: FulfilmentStatus.UNFULFILLED,
        status: OrderStatus.OPEN,
        currency: "ZAR",
        subtotal,
        shippingTotal: shipping.price,
        total,
        shippingMethod: shipping.id,
        internalNotes: "Awaiting payment confirmation.",
        items: {
          create: [
            {
              productId: variantRecord.productId,
              variantId: stock.variant.id,
              productName: "100% Cotton Corduroy Dungarees",
              sku: stock.variant.sku,
              colour: stock.variant.colourName,
              size: stock.variant.sizeName,
              unitPrice,
              quantity: input.quantity,
              lineTotal: subtotal,
            },
          ],
        },
        payments: {
          create: [
            {
              provider: "pending",
              status: PaymentStatus.PENDING,
              amount: total,
              currency: "ZAR",
              metadata: { checkoutToken },
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    const reservation = await reserveStockForOrder({
      orderId: order.id,
      variantId: stock.variant.id,
      quantity: input.quantity,
    });

    if (!reservation.ok) {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
          fulfilmentStatus: FulfilmentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
      return {
        ok: false as const,
        code: "out_of_stock" as const,
        message: reservation.message,
      };
    }

    return {
      ok: true as const,
      checkoutToken,
      order: {
        id: order.id,
        number: order.number,
        createdAt: order.createdAt.toISOString(),
        status: "awaiting_payment" as const,
        customer,
        shippingAddress,
        billingAddress,
        billingSameAsShipping: input.billingSameAsShipping,
        shippingMethodId: shipping.id,
        shippingPrice: shipping.price,
        line: {
          productName: "100% Cotton Corduroy Dungarees",
          colour: stock.variant.colourName,
          size: stock.variant.sizeName,
          quantity: input.quantity,
          unitPrice,
          sku: stock.variant.sku,
        },
        subtotal,
        total,
        currency: "ZAR",
        estimatedDispatch: "Dispatch timing to be confirmed",
        paymentNote: "Awaiting payment confirmation.",
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      code: "validation" as const,
      message:
        error instanceof Error ? error.message : "Unable to create the order.",
    };
  }
}

function mapOrder(
  order: {
    id: string;
    number: string;
    createdAt: Date;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    customerEmail: string;
    customerName: string;
    customerPhone: string | null;
    shippingAddress: unknown;
    billingAddress: unknown;
    shippingMethod: string | null;
    shippingTotal: { toString(): string } | number;
    subtotal: { toString(): string } | number;
    total: { toString(): string } | number;
    currency: string;
    items: Array<{
      productName: string;
      colour: string;
      size: string;
      quantity: number;
      unitPrice: { toString(): string } | number;
      sku: string;
    }>;
  },
  checkoutToken?: string,
) {
  const item = order.items[0];
  const shippingAddress = order.shippingAddress as OrderAddress;
  const billingAddress = order.billingAddress as OrderAddress;
  const billingSameAsShipping =
    JSON.stringify(shippingAddress) === JSON.stringify(billingAddress);

  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    status:
      order.status === OrderStatus.CANCELLED
        ? ("cancelled" as const)
        : order.paymentStatus === PaymentStatus.PAID
          ? ("paid" as const)
          : ("awaiting_payment" as const),
    customer: {
      email: order.customerEmail,
      firstName: order.customerName.split(" ")[0] ?? "",
      lastName: order.customerName.split(" ").slice(1).join(" ") || "",
      phone: order.customerPhone ?? "",
    },
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
    shippingMethodId: order.shippingMethod ?? "standard",
    shippingPrice: Number(order.shippingTotal),
    line: {
      productName: item?.productName ?? "100% Cotton Corduroy Dungarees",
      colour: item?.colour ?? "",
      size: item?.size ?? "",
      quantity: item?.quantity ?? 0,
      unitPrice: Number(item?.unitPrice ?? 0),
      sku: item?.sku ?? null,
    },
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    currency: order.currency,
    estimatedDispatch: "Dispatch timing to be confirmed",
    paymentNote: "Awaiting payment confirmation.",
    checkoutToken,
  };
}

export async function getOrder(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return null;
  return mapOrder(order);
}

export async function getCheckoutOrder(input: {
  orderNumber: string;
  checkoutToken: string;
}) {
  const order = await db.order.findUnique({
    where: { number: input.orderNumber },
    include: { items: true, payments: true },
  });
  if (!order) return null;

  const token = order.payments
    .map((payment) => readCheckoutToken(payment.metadata))
    .find(Boolean);

  if (!tokensMatch(token, input.checkoutToken)) return null;

  return mapOrder(order, token);
}

export async function assertCheckoutAccess(input: {
  orderId: string;
  checkoutToken: string;
}) {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { payments: true },
  });
  if (!order) return null;

  const token = order.payments
    .map((payment) => readCheckoutToken(payment.metadata))
    .find(Boolean);

  if (!tokensMatch(token, input.checkoutToken)) return null;
  return order;
}

export async function cancelOrder(id: string) {
  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.status === OrderStatus.CANCELLED) return null;
  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new Error("Paid orders cannot be cancelled from checkout.");
  }

  await releaseOrderReservation(id);
  const updated = await db.order.update({
    where: { id },
    data: {
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.CANCELLED,
      fulfilmentStatus: FulfilmentStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });

  return getOrder(updated.id);
}

export async function cancelCheckoutOrder(input: {
  orderId: string;
  checkoutToken: string;
}) {
  const order = await assertCheckoutAccess(input);
  if (!order) return null;
  return cancelOrder(order.id);
}

export async function listOrdersForAdmin(input?: { take?: number }) {
  return db.order.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: input?.take ?? 50,
  });
}
