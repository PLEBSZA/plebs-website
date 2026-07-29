import "server-only";

import {
  FulfilmentStatus,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import {
  convertOrderReservation,
  releaseOrderReservation,
} from "@/lib/commerce/inventory-reservation";
import { db } from "@/lib/db";

async function upsertFulfilment(
  orderId: string,
  data: {
    status: FulfilmentStatus;
    packedById?: string;
    packedAt?: Date;
    fulfilledById?: string;
    fulfilledAt?: Date;
    dispatchedAt?: Date;
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

export async function markOrderPaid(input: {
  orderId: string;
  provider: string;
  providerReference?: string | null;
  providerEventId?: string | null;
  amount?: number;
  actorId?: string;
}) {
  const order = await db.$transaction(async (tx) => {
    const current = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { payments: true },
    });

    if (current.status === OrderStatus.CANCELLED) {
      throw new Error("Cannot mark a cancelled order as paid.");
    }

    if (current.paymentStatus === PaymentStatus.PAID) {
      return current;
    }

    if (input.providerEventId) {
      const existingEvent = await tx.payment.findUnique({
        where: { providerEventId: input.providerEventId },
      });
      if (existingEvent) {
        return current;
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

    return tx.order.update({
      where: { id: current.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        fulfilmentStatus:
          current.fulfilmentStatus === FulfilmentStatus.UNFULFILLED
            ? FulfilmentStatus.PROCESSING
            : current.fulfilmentStatus,
        internalNotes: current.internalNotes?.includes("Payment gateway")
          ? null
          : current.internalNotes,
      },
    });
  });

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

  await db.order.update({
    where: { id: order.id },
    data: {
      fulfilmentStatus: FulfilmentStatus.FULFILLED,
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
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

  return fulfilment;
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
  if (order.fulfilmentStatus === FulfilmentStatus.FULFILLED) {
    throw new Error(
      "Fulfilled orders cannot be cancelled. Create a return instead.",
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
