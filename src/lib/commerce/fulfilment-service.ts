import "server-only";

import {
  FulfilmentStatus,
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import {
  PAID_AFTER_EXPIRED_RESERVATION_NOTE,
  releaseOrderReservationWithClient,
  settlePaidOrderReservationWithClient,
} from "@/lib/commerce/inventory-reservation";
import { db } from "@/lib/db";
import { sendOrderPaidEmails } from "@/lib/email/order-emails";
import { provisionPaidOrderAccount } from "@/lib/account/provision-paid-order";

async function upsertFulfilment(
  orderId: string,
  data: {
    status: FulfilmentStatus;
    packedById?: string;
    packedAt?: Date;
    fulfilledById?: string;
    fulfilledAt?: Date;
    dispatchedAt?: Date;
    deliveredAt?: Date;
    courier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    internalNote?: string | null;
  },
) {
  const existing = await db.fulfilment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return db.fulfilment.update({
      where: { id: existing.id },
      data,
    });
  }

  return db.fulfilment.create({
    data: {
      orderId,
      ...data,
    },
  });
}

const TERMINAL_RETURN_STATUSES = new Set<ReturnStatus>([
  ReturnStatus.CLOSED,
  ReturnStatus.REJECTED,
  ReturnStatus.REFUNDED,
]);

export type CompleteOrderResult =
  | { ok: true }
  | { ok: false; reason: string };

export function getCompleteOrderBlocker(order: {
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
  returnRequests: { id: string; reference?: string | null; status: ReturnStatus }[];
}): string | null {
  if (order.paymentStatus !== PaymentStatus.PAID) {
    return "Not yet paid";
  }
  if (order.fulfilmentStatus !== FulfilmentStatus.DELIVERED) {
    return "Not yet delivered";
  }
  const openReturn = order.returnRequests.find(
    (entry) => !TERMINAL_RETURN_STATUSES.has(entry.status),
  );
  if (openReturn) {
    const label = openReturn.reference ?? openReturn.id.slice(0, 8);
    return `Waiting on return ${label}`;
  }
  return null;
}

export async function markOrderPaid(input: {
  orderId: string;
  provider: string;
  providerReference?: string | null;
  providerEventId?: string | null;
  amount?: number;
  actorId?: string;
}) {
  const { order, newlyPaid } = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${input.orderId} FOR UPDATE`;
    const current = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { payments: true },
    });

    if (current.paymentStatus === PaymentStatus.PAID) {
      return { order: current, newlyPaid: false };
    }

    if (input.providerEventId) {
      const existingEvent = await tx.payment.findUnique({
        where: { providerEventId: input.providerEventId },
      });
      if (existingEvent) {
        return { order: current, newlyPaid: false };
      }
    }

    const payment =
      current.payments.find((entry) => entry.provider === input.provider) ??
      current.payments[0];

    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          provider: input.provider,
          providerReference:
            input.providerReference ?? payment.providerReference,
          providerEventId: input.providerEventId ?? payment.providerEventId,
          amount:
            input.amount != null ? input.amount.toFixed(2) : payment.amount,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: current.id,
          provider: input.provider,
          providerReference: input.providerReference,
          providerEventId: input.providerEventId,
          status: PaymentStatus.PAID,
          amount: (input.amount ?? Number(current.total)).toFixed(2),
          currency: current.currency,
        },
      });
    }

    const settlement = await settlePaidOrderReservationWithClient(tx, current.id);
    const restockNote = settlement.restockRequired
      ? PAID_AFTER_EXPIRED_RESERVATION_NOTE
      : null;
    const nextNotes = restockNote
      ? [current.internalNotes, restockNote].filter(Boolean).join("\n")
      : current.internalNotes?.includes("Awaiting payment confirmation")
        ? null
        : current.internalNotes;

    const updated = await tx.order.update({
      where: { id: current.id },
      data: {
        status: OrderStatus.OPEN,
        cancelledAt: null,
        paymentStatus: PaymentStatus.PAID,
        fulfilmentStatus:
          current.fulfilmentStatus === FulfilmentStatus.UNFULFILLED ||
          current.fulfilmentStatus === FulfilmentStatus.CANCELLED
            ? FulfilmentStatus.PROCESSING
            : current.fulfilmentStatus,
        inventoryHold: settlement.restockRequired,
        internalNotes: nextNotes,
      },
    });

    return { order: updated, newlyPaid: true };
  });

  if (newlyPaid) {
    const { revalidateStorefrontCatalogue } = await import(
      "@/lib/commerce/revalidate-storefront"
    );
    revalidateStorefrontCatalogue();

    await recordAuditEvent({
      actorId: input.actorId,
      action: "order.paid",
      entityType: "order",
      entityId: order.id,
      afterState: {
        paymentStatus: order.paymentStatus,
        provider: input.provider,
        providerReference: input.providerReference ?? null,
      },
    });

    try {
      await provisionPaidOrderAccount(order.id);
    } catch (error) {
      console.error(
        "Order was paid, but the customer account could not be provisioned:",
        error instanceof Error ? error.message : "Unknown account error",
      );
    }
  }

  // Safe on callback + webhook retries: payment metadata + Resend
  // idempotency keys prevent duplicate customer/owner emails.
  try {
    await sendOrderPaidEmails(order.id);
  } catch (error) {
    console.error(
      "Order was paid, but its confirmation email could not be sent:",
      error instanceof Error ? error.message : "Unknown email error",
    );
  }

  return order;
}

export async function markOrderPacked(input: {
  orderId: string;
  userId: string;
}) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
  });

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Cancelled orders cannot be packed.");
  }
  if (order.paymentStatus !== PaymentStatus.PAID) {
    throw new Error("Orders must be paid before packing.");
  }
  if (order.inventoryHold) {
    throw new Error(
      "This order is on inventory hold. Restock the size and retry reservation before packing.",
    );
  }

  const fulfilment = await upsertFulfilment(order.id, {
    status: FulfilmentStatus.PACKED,
    packedById: input.userId,
    packedAt: new Date(),
  });

  await db.order.update({
    where: { id: order.id },
    data: { fulfilmentStatus: FulfilmentStatus.PACKED },
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.packed",
    entityType: "order",
    entityId: order.id,
  });

  return fulfilment;
}

export async function resolveInventoryHold(input: {
  orderId: string;
  userId: string;
}) {
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${input.orderId} FOR UPDATE`;
    const current = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
    });

    if (current.status === OrderStatus.CANCELLED) {
      throw new Error("Cancelled orders cannot leave inventory hold.");
    }
    if (current.paymentStatus !== PaymentStatus.PAID) {
      throw new Error("Only paid orders can leave inventory hold.");
    }
    if (!current.inventoryHold) {
      return { order: current, resolved: false as const };
    }

    const settlement = await settlePaidOrderReservationWithClient(
      tx,
      current.id,
    );
    if (settlement.restockRequired) {
      throw new Error(
        "Stock is still unavailable for this order. Restock the size, then retry.",
      );
    }

    const updated = await tx.order.update({
      where: { id: current.id },
      data: { inventoryHold: false },
    });
    return { order: updated, resolved: true as const };
  });

  if (result.resolved) {
    const { revalidateStorefrontCatalogue } = await import(
      "@/lib/commerce/revalidate-storefront"
    );
    revalidateStorefrontCatalogue();

    await recordAuditEvent({
      actorId: input.userId,
      action: "order.inventory_hold_resolved",
      entityType: "order",
      entityId: result.order.id,
    });
  }

  return result.order;
}

export async function fulfilOrder(input: {
  orderId: string;
  userId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  note?: string;
}) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
  });

  if (order.paymentStatus !== PaymentStatus.PAID) {
    throw new Error("Orders must be paid before fulfilment.");
  }
  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Cancelled orders cannot be fulfilled.");
  }
  if (order.inventoryHold) {
    throw new Error(
      "This order is on inventory hold. Restock the size and retry reservation before dispatch.",
    );
  }

  const fulfilment = await upsertFulfilment(order.id, {
    status: FulfilmentStatus.FULFILLED,
    courier: input.courier.trim(),
    trackingNumber: input.trackingNumber.trim(),
    trackingUrl: input.trackingUrl?.trim() || null,
    fulfilledById: input.userId,
    fulfilledAt: new Date(),
    dispatchedAt: new Date(),
    internalNote: input.note?.trim() || null,
  });

  // Stay OPEN after dispatch — parcel is still in transit (ISSUE-01).
  await db.order.update({
    where: { id: order.id },
    data: {
      fulfilmentStatus: FulfilmentStatus.FULFILLED,
    },
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.fulfilled",
    entityType: "order",
    entityId: order.id,
    afterState: {
      courier: fulfilment.courier,
      trackingNumber: fulfilment.trackingNumber,
    },
  });

  // Dispatch email is operator-triggered via sendTrackingEmailAction (PLEBS-ORDERS-003).
  return fulfilment;
}

export async function updateFulfilmentTracking(input: {
  orderId: string;
  userId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  note?: string;
}) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
    include: {
      fulfilments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Cancelled orders cannot update tracking.");
  }

  const existing = order.fulfilments[0];
  if (!existing) {
    throw new Error("No fulfilment record exists for this order yet.");
  }

  const courier = input.courier.trim();
  const trackingNumber = input.trackingNumber.trim();
  const trackingUrl = input.trackingUrl?.trim() || null;
  if (!courier || !trackingNumber) {
    throw new Error("Courier and tracking number are required.");
  }

  const note = input.note?.trim();
  const internalNote = note
    ? [existing.internalNote, note].filter(Boolean).join("\n")
    : existing.internalNote;

  const updated = await db.fulfilment.update({
    where: { id: existing.id },
    data: {
      courier,
      trackingNumber,
      trackingUrl,
      internalNote,
    },
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.tracking_updated",
    entityType: "order",
    entityId: order.id,
    beforeState: {
      courier: existing.courier,
      trackingNumber: existing.trackingNumber,
      trackingUrl: existing.trackingUrl,
    },
    afterState: {
      courier: updated.courier,
      trackingNumber: updated.trackingNumber,
      trackingUrl: updated.trackingUrl,
    },
  });

  return updated;
}

export async function markOrderDelivered(input: {
  orderId: string;
  userId?: string;
  deliveredAt?: Date;
  note?: string;
}) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
    include: {
      fulfilments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Cancelled orders cannot be marked delivered.");
  }

  if (order.fulfilmentStatus === FulfilmentStatus.DELIVERED) {
    return order.fulfilments[0] ?? null;
  }

  if (order.fulfilmentStatus !== FulfilmentStatus.FULFILLED) {
    throw new Error("Only fulfilled (in-transit) orders can be marked delivered.");
  }

  const existing = order.fulfilments[0];
  const deliveredAt = input.deliveredAt ?? new Date();
  const now = new Date();

  if (deliveredAt.getTime() > now.getTime()) {
    throw new Error("Delivered date cannot be in the future.");
  }
  if (existing?.dispatchedAt && deliveredAt.getTime() < existing.dispatchedAt.getTime()) {
    throw new Error("Delivered date cannot be earlier than the dispatch date.");
  }

  const note = input.note?.trim();
  const internalNote = note
    ? [existing?.internalNote, note].filter(Boolean).join("\n")
    : existing?.internalNote ?? null;

  const fulfilment = await upsertFulfilment(order.id, {
    status: FulfilmentStatus.DELIVERED,
    deliveredAt,
    internalNote,
  });

  await db.order.update({
    where: { id: order.id },
    data: { fulfilmentStatus: FulfilmentStatus.DELIVERED },
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.delivered",
    entityType: "order",
    entityId: order.id,
    afterState: { deliveredAt: deliveredAt.toISOString() },
  });

  return fulfilment;
}

export async function completeOrder(input: {
  orderId: string;
  userId?: string;
  reason?: string;
}): Promise<CompleteOrderResult> {
  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
    include: { returnRequests: true },
  });

  if (order.status === OrderStatus.CANCELLED) {
    return { ok: false, reason: "Cancelled orders cannot be completed." };
  }

  if (order.status === OrderStatus.COMPLETED) {
    return { ok: true };
  }

  const blocker = getCompleteOrderBlocker(order);
  if (blocker) {
    return { ok: false, reason: blocker };
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.completed",
    entityType: "order",
    entityId: order.id,
    reason: input.reason,
    afterState: {
      status: OrderStatus.COMPLETED,
      ...(input.reason?.startsWith("auto-complete")
        ? { source: "autoCompleteDeliveredOrders" }
        : {}),
    },
  });

  return { ok: true };
}

export type AutoCompleteResult = {
  configured: boolean;
  dryRun: boolean;
  quietPeriodDays: number | null;
  candidates: { id: string; number: string; deliveredAt: string }[];
  completed: string[];
  refused: { id: string; number: string; reason: string }[];
  message?: string;
};

/**
 * Completes delivered, paid orders with no open returns after a quiet period.
 * Calls completeOrder() so guards stay in one place. Default is dry-run.
 * quietPeriodDays must come from the owner (env); there is no policy default.
 */
export async function autoCompleteDeliveredOrders(input?: {
  quietPeriodDays?: number;
  actorId?: string | null;
  dryRun?: boolean;
}): Promise<AutoCompleteResult> {
  const dryRun = input?.dryRun !== false;
  const fromEnv = process.env.ORDER_AUTO_COMPLETE_QUIET_PERIOD_DAYS?.trim();
  const quietPeriodDays =
    input?.quietPeriodDays ??
    (fromEnv && Number.isFinite(Number(fromEnv)) ? Number(fromEnv) : null);

  if (quietPeriodDays == null || quietPeriodDays <= 0 || !Number.isFinite(quietPeriodDays)) {
    const message =
      "ORDER_AUTO_COMPLETE_QUIET_PERIOD_DAYS is unset or invalid; auto-complete no-op.";
    console.info(message);
    return {
      configured: false,
      dryRun,
      quietPeriodDays: null,
      candidates: [],
      completed: [],
      refused: [],
      message,
    };
  }

  const cutoff = new Date(
    Date.now() - quietPeriodDays * 24 * 60 * 60 * 1000,
  );

  const orders = await db.order.findMany({
    where: {
      status: OrderStatus.OPEN,
      paymentStatus: PaymentStatus.PAID,
      fulfilmentStatus: FulfilmentStatus.DELIVERED,
      fulfilments: {
        some: {
          deliveredAt: { lt: cutoff, not: null },
        },
      },
      returnRequests: {
        none: {
          status: {
            notIn: [
              ReturnStatus.CLOSED,
              ReturnStatus.REJECTED,
              ReturnStatus.REFUNDED,
            ],
          },
        },
      },
    },
    include: {
      fulfilments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    take: 100,
  });

  const candidates = orders.map((order) => ({
    id: order.id,
    number: order.number,
    deliveredAt:
      order.fulfilments[0]?.deliveredAt?.toISOString() ?? "unknown",
  }));

  if (dryRun) {
    return {
      configured: true,
      dryRun: true,
      quietPeriodDays,
      candidates,
      completed: [],
      refused: [],
      message: `Dry-run: ${candidates.length} order(s) would be completed.`,
    };
  }

  const completed: string[] = [];
  const refused: { id: string; number: string; reason: string }[] = [];

  for (const order of orders) {
    const result = await completeOrder({
      orderId: order.id,
      userId: input?.actorId ?? undefined,
      reason: `auto-complete after ${quietPeriodDays}-day quiet period`,
    });
    if (result.ok) {
      completed.push(order.id);
    } else {
      refused.push({
        id: order.id,
        number: order.number,
        reason: result.reason,
      });
    }
  }

  return {
    configured: true,
    dryRun: false,
    quietPeriodDays,
    candidates,
    completed,
    refused,
  };
}

export async function reopenOrder(input: {
  orderId: string;
  userId: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("A reason is required to reopen an order.");
  }

  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
  });

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Cancelled orders cannot be reopened.");
  }

  if (order.status === OrderStatus.OPEN && order.completedAt == null) {
    return order;
  }

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.OPEN,
      completedAt: null,
    },
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.reopened",
    entityType: "order",
    entityId: order.id,
    reason,
    beforeState: {
      status: order.status,
      completedAt: order.completedAt?.toISOString() ?? null,
    },
    afterState: { status: OrderStatus.OPEN, completedAt: null },
  });

  return updated;
}

export async function cancelOrderAdmin(input: {
  orderId: string;
  userId: string;
  reason?: string;
}) {
  const updated = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${input.orderId} FOR UPDATE`;
    const order = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
    });

    if (order.status === OrderStatus.CANCELLED) return order;
    if (
      order.fulfilmentStatus === FulfilmentStatus.FULFILLED ||
      order.fulfilmentStatus === FulfilmentStatus.DELIVERED
    ) {
      throw new Error(
        "Fulfilled or delivered orders cannot be cancelled. Create a return instead.",
      );
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      await releaseOrderReservationWithClient(tx, order.id);
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus:
          order.paymentStatus === PaymentStatus.PAID
            ? order.paymentStatus
            : PaymentStatus.CANCELLED,
        fulfilmentStatus: FulfilmentStatus.CANCELLED,
        cancelledAt: new Date(),
        internalNotes: [order.internalNotes, input.reason]
          .filter(Boolean)
          .join("\n"),
      },
    });
  });

  const { revalidateStorefrontCatalogue } = await import(
    "@/lib/commerce/revalidate-storefront"
  );
  revalidateStorefrontCatalogue();

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.cancelled",
    entityType: "order",
    entityId: updated.id,
    reason: input.reason,
  });

  return updated;
}
