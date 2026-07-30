import "server-only";

import {
  FulfilmentStatus,
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import {
  convertOrderReservation,
  releaseOrderReservation,
} from "@/lib/commerce/inventory-reservation";
import { db } from "@/lib/db";
import { sendOrderPaidEmails } from "@/lib/email/order-emails";

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
    const current = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { payments: true },
    });

    if (current.status === OrderStatus.CANCELLED) {
      throw new Error("Cannot mark a cancelled order as paid.");
    }

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

    const updated = await tx.order.update({
      where: { id: current.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        fulfilmentStatus:
          current.fulfilmentStatus === FulfilmentStatus.UNFULFILLED
            ? FulfilmentStatus.PROCESSING
            : current.fulfilmentStatus,
        internalNotes: current.internalNotes?.includes(
          "Awaiting payment confirmation",
        )
          ? null
          : current.internalNotes,
      },
    });

    return { order: updated, newlyPaid: true };
  });

  if (newlyPaid) {
    const activeReservations = await db.inventoryReservation.count({
      where: { orderId: order.id, status: "ACTIVE" },
    });
    if (activeReservations > 0) {
      await convertOrderReservation(order.id);
    }

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
    afterState: { status: OrderStatus.COMPLETED },
  });

  return { ok: true };
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
  const order = await db.order.findUniqueOrThrow({
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

  await releaseOrderReservation(order.id);

  const updated = await db.order.update({
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

  await recordAuditEvent({
    actorId: input.userId,
    action: "order.cancelled",
    entityType: "order",
    entityId: order.id,
    reason: input.reason,
  });

  return updated;
}
