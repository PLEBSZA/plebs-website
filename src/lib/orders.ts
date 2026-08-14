import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  FulfilmentStatus,
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
  VariantStatus,
  type Prisma,
} from "@/generated/prisma/client";
import {
  checkoutDetailsSchema,
  flattenCheckoutFieldErrors,
  type CheckoutDetailsInput,
} from "@/lib/checkout/schema";
import { db } from "@/lib/db";
import {
  releaseOrderReservationWithClient,
  syncOrderReservationWithClient,
  type InventoryTx,
} from "@/lib/commerce/inventory-reservation";
import { revalidateStorefrontCatalogue } from "@/lib/commerce/revalidate-storefront";
import { findStorefrontVariant } from "@/lib/commerce/storefront-product";
import { getReusablePaystackRedirect } from "@/lib/commerce/paystack";
import { getShippingMethod, type ShippingMethod } from "@/lib/shipping";

type CheckoutPaymentMetadata = {
  checkoutToken?: string;
  authorization_url?: string;
  access_code?: string;
  initialized_email?: string;
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

function readPaymentMetadata(metadata: unknown): CheckoutPaymentMetadata {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as CheckoutPaymentMetadata;
}

function isUniqueConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

class StockUnavailableError extends Error {
  readonly code = "out_of_stock" as const;
}

class CheckoutConflictError extends Error {
  readonly code = "conflict" as const;
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
  checkoutKey: string;
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

/** Human-readable RMA reference, same shape as order numbers. */
export function createReturnReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.floor(Math.random() * 900 + 100).toString();
  return `RMA-${stamp}-${suffix}`;
}

async function loadPricedVariant(
  tx: InventoryTx,
  colour: string,
  size: string,
) {
  const catalogueVariant = await findStorefrontVariant({ colour, size });
  if (!catalogueVariant || catalogueVariant.status !== VariantStatus.ACTIVE) {
    throw new StockUnavailableError("Please choose a valid in-stock size.");
  }

  const variant = await tx.productVariant.findUnique({
    where: { id: catalogueVariant.id },
    select: {
      id: true,
      productId: true,
      sku: true,
      retailPrice: true,
      status: true,
      colourValue: { select: { label: true } },
      sizeValue: { select: { label: true } },
    },
  });

  if (!variant || variant.status !== VariantStatus.ACTIVE) {
    throw new StockUnavailableError("Please choose a valid in-stock size.");
  }

  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    retailPrice: Number(variant.retailPrice),
    colourName: variant.colourValue.label,
    sizeName: variant.sizeValue.label,
  };
}

async function upsertCustomerInTransaction(
  tx: InventoryTx,
  customer: CheckoutDetailsInput["customer"],
) {
  return tx.customer.upsert({
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
}

async function upsertCheckoutInTransaction(
  tx: InventoryTx,
  details: CheckoutDetailsInput,
  shipping: ShippingMethod,
) {
  const existing = await tx.order.findUnique({
    where: { checkoutKey: details.checkoutKey },
    include: { items: true, payments: true },
  });

  if (existing) {
    if (existing.paymentStatus === PaymentStatus.PAID) {
      throw new CheckoutConflictError("This checkout is already paid.");
    }
    if (existing.status === OrderStatus.CANCELLED) {
      throw new CheckoutConflictError(
        "This checkout was cancelled. Start again from the cart.",
      );
    }
  }

  const variant = await loadPricedVariant(tx, details.colour, details.size);
  const shippingAddress = details.shippingAddress;
  const billingAddress = details.billingSameAsShipping
    ? shippingAddress
    : (details.billingAddress ?? shippingAddress);
  const unitPrice = variant.retailPrice;
  const subtotal = Number((unitPrice * details.quantity).toFixed(2));
  const total = Number((subtotal + shipping.price).toFixed(2));
  const customerName = `${details.customer.firstName} ${details.customer.lastName}`;
  const dbCustomer = await upsertCustomerInTransaction(tx, details.customer);

  const itemData = {
    productId: variant.productId,
    variantId: variant.id,
    productName: "100% Cotton Corduroy Dungarees",
    sku: variant.sku,
    colour: variant.colourName,
    size: variant.sizeName,
    unitPrice,
    quantity: details.quantity,
    lineTotal: subtotal,
  };

  if (existing) {
    const amountChanged = Number(existing.total) !== total;
    const emailChanged = existing.customerEmail !== details.customer.email;
    const pendingPayment =
      existing.payments.find((payment) => payment.status === PaymentStatus.PENDING) ??
      existing.payments[0];
    const existingMetadata = readPaymentMetadata(pendingPayment?.metadata);
    const checkoutToken =
      existingMetadata.checkoutToken ?? createCheckoutToken();
    const nextMetadata: CheckoutPaymentMetadata = {
      checkoutToken,
    };
    if (!amountChanged && !emailChanged) {
      nextMetadata.authorization_url = existingMetadata.authorization_url;
      nextMetadata.access_code = existingMetadata.access_code;
      nextMetadata.initialized_email = existingMetadata.initialized_email;
    }

    const reservation = await syncOrderReservationWithClient(tx, {
      orderId: existing.id,
      variantId: variant.id,
      quantity: details.quantity,
    });
    if (!reservation.ok) {
      throw new StockUnavailableError(reservation.message);
    }

    const currentItem = existing.items[0];
    if (currentItem) {
      await tx.orderItem.update({
        where: { id: currentItem.id },
        data: itemData,
      });
    } else {
      await tx.orderItem.create({
        data: { ...itemData, orderId: existing.id },
      });
    }

    if (pendingPayment) {
      await tx.payment.update({
        where: { id: pendingPayment.id },
        data: {
          amount: total,
          currency: "ZAR",
          status: PaymentStatus.PENDING,
          providerReference:
            amountChanged || emailChanged
              ? null
              : pendingPayment.providerReference,
          metadata: nextMetadata as Prisma.InputJsonValue,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: existing.id,
          provider: "pending",
          status: PaymentStatus.PENDING,
          amount: total,
          currency: "ZAR",
          metadata: nextMetadata as Prisma.InputJsonValue,
        },
      });
    }

    const order = await tx.order.update({
      where: { id: existing.id },
      data: {
        customerId: dbCustomer.id,
        customerEmail: details.customer.email,
        customerName,
        customerPhone: details.customer.phone,
        shippingAddress,
        billingAddress,
        subtotal,
        shippingTotal: shipping.price,
        total,
        shippingMethod: shipping.id,
        internalNotes: "Awaiting payment confirmation.",
      },
      include: { items: true },
    });

    return {
      ok: true as const,
      reused: true,
      checkoutToken,
      order: mapOrder(order, checkoutToken),
    };
  }

  const checkoutToken = createCheckoutToken();
  const order = await tx.order.create({
    data: {
      number: createOrderNumber(),
      checkoutKey: details.checkoutKey,
      customerId: dbCustomer.id,
      customerEmail: details.customer.email,
      customerName,
      customerPhone: details.customer.phone,
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
        create: [itemData],
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
    include: { items: true },
  });

  const reservation = await syncOrderReservationWithClient(tx, {
    orderId: order.id,
    variantId: variant.id,
    quantity: details.quantity,
  });
  if (!reservation.ok) {
    throw new StockUnavailableError(reservation.message);
  }

  return {
    ok: true as const,
    reused: false,
    checkoutToken,
    order: mapOrder(order, checkoutToken),
  };
}

export async function createOrder(input: CreateOrderInput) {
  const parsed = checkoutDetailsSchema.safeParse({
    checkoutKey: input.checkoutKey,
    customer: input.customer,
    shippingAddress: {
      ...input.shippingAddress,
      country: "South Africa",
    },
    billingSameAsShipping: input.billingSameAsShipping,
    billingAddress: input.billingAddress
      ? { ...input.billingAddress, country: "South Africa" as const }
      : undefined,
    shippingMethodId: input.shippingMethodId,
    colour: input.colour,
    size: input.size,
    quantity: input.quantity,
  });

  if (!parsed.success) {
    const fields = flattenCheckoutFieldErrors(parsed.error);
    return {
      ok: false as const,
      code: "validation" as const,
      message: Object.values(fields)[0] ?? "Check the highlighted fields.",
      fields,
    };
  }

  const shipping = getShippingMethod(parsed.data.shippingMethodId);
  if (!shipping) {
    return {
      ok: false as const,
      code: "validation" as const,
      message: "Select a delivery method.",
    };
  }

  try {
    const result = await db.$transaction((tx) =>
      upsertCheckoutInTransaction(tx, parsed.data, shipping),
    );
    revalidateStorefrontCatalogue();
    return result;
  } catch (error) {
    if (error instanceof StockUnavailableError) {
      return {
        ok: false as const,
        code: "out_of_stock" as const,
        message: error.message,
      };
    }
    if (error instanceof CheckoutConflictError) {
      return {
        ok: false as const,
        code: "conflict" as const,
        message: error.message,
      };
    }
    if (isUniqueConstraint(error)) {
      try {
        const result = await db.$transaction((tx) =>
          upsertCheckoutInTransaction(tx, parsed.data, shipping),
        );
        revalidateStorefrontCatalogue();
        return result;
      } catch (retryError) {
        if (retryError instanceof StockUnavailableError) {
          return {
            ok: false as const,
            code: "out_of_stock" as const,
            message: retryError.message,
          };
        }
        if (retryError instanceof CheckoutConflictError) {
          return {
            ok: false as const,
            code: "conflict" as const,
            message: retryError.message,
          };
        }
      }
    }
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
    checkoutKey?: string | null;
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
    checkoutKey: "checkoutKey" in order ? (order.checkoutKey as string | null) : null,
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

  const reusable = getReusablePaystackRedirect(order);
  return {
    ...mapOrder(order, token),
    paymentReady: Boolean(reusable),
    authorizationUrl: reusable?.authorizationUrl ?? null,
  };
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
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`;
    const current = await tx.order.findUnique({ where: { id } });
    if (!current || current.status === OrderStatus.CANCELLED) return null;
    if (current.paymentStatus === PaymentStatus.PAID) {
      throw new Error("Paid orders cannot be cancelled from checkout.");
    }

    const updated = await tx.order.updateMany({
      where: {
        id,
        status: { not: OrderStatus.CANCELLED },
        paymentStatus: { not: PaymentStatus.PAID },
      },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
        fulfilmentStatus: FulfilmentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
    if (updated.count !== 1) {
      throw new Error("Paid orders cannot be cancelled from checkout.");
    }

    await releaseOrderReservationWithClient(tx, id);
    return true;
  });

  if (!result) return null;
  revalidateStorefrontCatalogue();
  return getOrder(id);
}

export async function cancelCheckoutOrder(input: {
  orderId: string;
  checkoutToken: string;
}) {
  const order = await assertCheckoutAccess(input);
  if (!order) return null;
  return cancelOrder(order.id);
}

export type AdminOrderView = "open" | "completed" | "returns" | "cancelled";

const TERMINAL_RETURN_STATUSES: ReturnStatus[] = [
  ReturnStatus.CLOSED,
  ReturnStatus.REJECTED,
  ReturnStatus.REFUNDED,
];

function buildOrderSearchWhere(search: string) {
  const q = search.trim();
  if (!q) return undefined;
  return {
    OR: [
      { number: { contains: q, mode: "insensitive" as const } },
      { customerName: { contains: q, mode: "insensitive" as const } },
      { customerEmail: { contains: q, mode: "insensitive" as const } },
      {
        fulfilments: {
          some: {
            trackingNumber: { contains: q, mode: "insensitive" as const },
          },
        },
      },
      {
        returnRequests: {
          some: {
            reference: { contains: q, mode: "insensitive" as const },
          },
        },
      },
    ],
  };
}

export async function getAdminOrderViewCounts(search?: string) {
  const searchWhere = buildOrderSearchWhere(search ?? "");
  const [open, completed, returnsOpen, cancelled] = await Promise.all([
    db.order.count({
      where: {
        status: OrderStatus.OPEN,
        AND: searchWhere ? [searchWhere] : undefined,
      },
    }),
    db.order.count({
      where: {
        status: OrderStatus.COMPLETED,
        AND: searchWhere ? [searchWhere] : undefined,
      },
    }),
    db.returnRequest.count({
      where: {
        status: { notIn: TERMINAL_RETURN_STATUSES },
        AND: search
          ? [
              {
                OR: [
                  {
                    reference: {
                      contains: search.trim(),
                      mode: "insensitive",
                    },
                  },
                  {
                    order: {
                      OR: [
                        {
                          number: {
                            contains: search.trim(),
                            mode: "insensitive",
                          },
                        },
                        {
                          customerName: {
                            contains: search.trim(),
                            mode: "insensitive",
                          },
                        },
                        {
                          customerEmail: {
                            contains: search.trim(),
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ]
          : undefined,
      },
    }),
    db.order.count({
      where: {
        status: OrderStatus.CANCELLED,
        AND: searchWhere ? [searchWhere] : undefined,
      },
    }),
  ]);

  return { open, completed, returns: returnsOpen, cancelled };
}

export async function listOrdersForAdmin(input?: {
  take?: number;
  view?: AdminOrderView;
  search?: string;
  includeTerminalReturns?: boolean;
  cursor?: string;
}) {
  const take = input?.take ?? 50;
  const view = input?.view ?? "open";
  const searchWhere = buildOrderSearchWhere(input?.search ?? "");

  if (view === "returns") {
    return {
      kind: "returns" as const,
      rows: await db.returnRequest.findMany({
        where: {
          ...(input?.includeTerminalReturns
            ? {}
            : { status: { notIn: TERMINAL_RETURN_STATUSES } }),
          ...(input?.search?.trim()
            ? {
                OR: [
                  {
                    reference: {
                      contains: input.search.trim(),
                      mode: "insensitive",
                    },
                  },
                  {
                    order: {
                      OR: [
                        {
                          number: {
                            contains: input.search.trim(),
                            mode: "insensitive",
                          },
                        },
                        {
                          customerName: {
                            contains: input.search.trim(),
                            mode: "insensitive",
                          },
                        },
                        {
                          customerEmail: {
                            contains: input.search.trim(),
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          order: {
            select: {
              id: true,
              number: true,
              customerName: true,
              customerEmail: true,
            },
          },
          exchange: true,
        },
        orderBy: { requestedAt: "asc" },
        take,
        ...(input?.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      }),
    };
  }

  const statusFilter =
    view === "completed"
      ? OrderStatus.COMPLETED
      : view === "cancelled"
        ? OrderStatus.CANCELLED
        : OrderStatus.OPEN;

  const orderInclude = {
    items: true,
    fulfilments: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
    },
    returnRequests: {
      select: { id: true, reference: true, status: true },
    },
  };

  if (view === "open") {
    const held = await db.order.findMany({
      where: {
        status: OrderStatus.OPEN,
        inventoryHold: true,
        AND: searchWhere ? [searchWhere] : undefined,
      },
      include: orderInclude,
      orderBy: { createdAt: "asc" },
      take,
    });
    const remaining = Math.max(take - held.length, 0);
    const rest =
      remaining === 0
        ? []
        : await db.order.findMany({
            where: {
              status: OrderStatus.OPEN,
              inventoryHold: false,
              AND: searchWhere ? [searchWhere] : undefined,
            },
            include: orderInclude,
            orderBy: { createdAt: "asc" },
            take: Math.max(remaining * 3, remaining),
          });
    const { getOpenOrderSortPriority } = await import(
      "@/lib/commerce/order-next-action"
    );
    rest.sort((a, b) => {
      const pa = getOpenOrderSortPriority(a);
      const pb = getOpenOrderSortPriority(b);
      if (pa !== pb) return pa - pb;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    return {
      kind: "orders" as const,
      rows: [...held, ...rest.slice(0, remaining)],
    };
  }

  const orders = await db.order.findMany({
    where: {
      status: statusFilter,
      AND: searchWhere ? [searchWhere] : undefined,
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take,
    ...(input?.cursor
      ? { cursor: { id: input.cursor }, skip: 1 }
      : {}),
  });

  return { kind: "orders" as const, rows: orders };
}

/** @deprecated Prefer listOrdersForAdmin({ view: "open" }) */
export async function listRecentOrdersForAdmin(take = 20) {
  return db.order.findMany({
    include: {
      items: true,
      returnRequests: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
