import "server-only";

import {
  ExchangeStatus,
  FulfilmentStatus,
  InventoryMovementReason,
  InventoryMovementType,
  OrderStatus,
  ReturnDisposition,
  ReturnStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import { reopenOrder } from "@/lib/commerce/fulfilment-service";
import { db } from "@/lib/db";
import { createReturnReference } from "@/lib/orders";

const RETURN_ELIGIBLE_FULFILMENT = new Set<FulfilmentStatus>([
  FulfilmentStatus.FULFILLED,
  FulfilmentStatus.DELIVERED,
  FulfilmentStatus.RETURNED,
]);

const EXCHANGE_SHIPMENT_STATUSES = new Set<ReturnStatus>([
  ReturnStatus.EXCHANGE_PENDING,
  ReturnStatus.EXCHANGE_SENT,
  ReturnStatus.REFUND_PENDING,
  ReturnStatus.REFUNDED,
  ReturnStatus.CLOSED,
]);

export async function listReturnsForAdmin(input?: { take?: number }) {
  return db.returnRequest.findMany({
    include: {
      order: { select: { id: true, number: true, customerName: true } },
      orderItem: true,
      originalVariant: {
        include: { colourValue: true, sizeValue: true },
      },
      exchange: {
        include: {
          replacementVariant: {
            include: { colourValue: true, sizeValue: true },
          },
        },
      },
    },
    orderBy: { requestedAt: "desc" },
    take: input?.take ?? 50,
  });
}

export async function getReturnForAdmin(id: string) {
  return db.returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: true,
          fulfilments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      orderItem: true,
      originalVariant: {
        include: { colourValue: true, sizeValue: true },
      },
      exchange: {
        include: {
          replacementVariant: {
            include: { colourValue: true, sizeValue: true },
          },
        },
      },
    },
  });
}

export async function createReturnRequest(input: {
  orderId: string;
  orderItemId: string;
  reason: string;
  customerComments?: string;
  actorId: string;
  replacementVariantId?: string;
}) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: input.orderId },
    include: { items: true },
  });

  if (!RETURN_ELIGIBLE_FULFILMENT.has(order.fulfilmentStatus)) {
    throw new Error(
      "Returns can only be created for fulfilled, delivered, or returned orders.",
    );
  }

  const item = order.items.find((entry) => entry.id === input.orderItemId);
  if (!item) {
    throw new Error("Order item not found on this order.");
  }

  if (order.status === OrderStatus.COMPLETED) {
    await reopenOrder({
      orderId: order.id,
      userId: input.actorId,
      reason: "Return opened",
    });
  }

  const returnRequest = await db.returnRequest.create({
    data: {
      reference: createReturnReference(),
      orderId: order.id,
      orderItemId: item.id,
      customerId: order.customerId,
      originalVariantId: item.variantId,
      reason: input.reason.trim(),
      customerComments: input.customerComments?.trim() || null,
      status: ReturnStatus.REQUESTED,
      exchange: input.replacementVariantId
        ? {
            create: {
              originalVariantId: item.variantId,
              replacementVariantId: input.replacementVariantId,
              quantity: item.quantity,
              status: ExchangeStatus.REQUESTED,
            },
          }
        : undefined,
    },
    include: { exchange: true },
  });

  await recordAuditEvent({
    actorId: input.actorId,
    action: "return.created",
    entityType: "return_request",
    entityId: returnRequest.id,
    afterState: {
      orderId: order.id,
      reference: returnRequest.reference,
      reason: returnRequest.reason,
      hasExchange: Boolean(returnRequest.exchange),
    },
  });

  return returnRequest;
}

export async function updateReturnStatus(input: {
  returnId: string;
  status: ReturnStatus;
  actorId: string;
  returnTracking?: string;
  inspectionOutcome?: string;
  disposition?: ReturnDisposition;
  resolution?: string;
  internalNotes?: string;
}) {
  const before = await db.returnRequest.findUniqueOrThrow({
    where: { id: input.returnId },
    include: { exchange: true, orderItem: true },
  });

  const data: {
    status: ReturnStatus;
    returnTracking?: string;
    inspectionOutcome?: string;
    disposition?: ReturnDisposition;
    resolution?: string;
    internalNotes?: string;
    receivedAt?: Date;
  } = {
    status: input.status,
  };

  if (input.returnTracking != null) data.returnTracking = input.returnTracking;
  if (input.inspectionOutcome != null) {
    data.inspectionOutcome = input.inspectionOutcome;
  }
  if (input.disposition != null) data.disposition = input.disposition;
  if (input.resolution != null) data.resolution = input.resolution;
  if (input.internalNotes != null) data.internalNotes = input.internalNotes;
  if (
    input.status === ReturnStatus.RECEIVED ||
    input.status === ReturnStatus.INSPECTING
  ) {
    data.receivedAt = before.receivedAt ?? new Date();
  }

  const updated = await db.returnRequest.update({
    where: { id: input.returnId },
    data,
  });

  if (
    input.status === ReturnStatus.ACCEPTED &&
    input.disposition === ReturnDisposition.SELLABLE_STOCK &&
    before.originalVariantId
  ) {
    await restockReturnedVariant({
      variantId: before.originalVariantId,
      quantity: before.orderItem.quantity,
      returnId: before.id,
      actorId: input.actorId,
    });
  }

  if (
    before.exchange &&
    (input.status === ReturnStatus.EXCHANGE_PENDING ||
      input.status === ReturnStatus.EXCHANGE_SENT)
  ) {
    await db.exchange.update({
      where: { id: before.exchange.id },
      data: {
        status:
          input.status === ReturnStatus.EXCHANGE_SENT
            ? ExchangeStatus.EXCHANGE_SENT
            : ExchangeStatus.REPLACEMENT_PENDING,
      },
    });
  }

  await recordAuditEvent({
    actorId: input.actorId,
    action: "return.status_changed",
    entityType: "return_request",
    entityId: updated.id,
    beforeState: { status: before.status },
    afterState: { status: updated.status, disposition: input.disposition },
  });

  return updated;
}

export async function updateExchangeShipment(input: {
  exchangeId: string;
  userId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  note?: string;
}) {
  const exchange = await db.exchange.findUniqueOrThrow({
    where: { id: input.exchangeId },
    include: { returnRequest: true },
  });

  if (!EXCHANGE_SHIPMENT_STATUSES.has(exchange.returnRequest.status)) {
    throw new Error(
      "Outbound exchange tracking can only be set once the return is at exchange pending or later.",
    );
  }

  const courier = input.courier.trim();
  const trackingNumber = input.trackingNumber.trim();
  const trackingUrl = input.trackingUrl?.trim() || null;
  if (!courier || !trackingNumber) {
    throw new Error("Courier and tracking number are required.");
  }

  const dispatchedAt = exchange.dispatchedAt ?? new Date();
  const note = input.note?.trim();

  const updated = await db.$transaction(async (tx) => {
    const next = await tx.exchange.update({
      where: { id: exchange.id },
      data: {
        courier,
        trackingNumber,
        trackingUrl,
        dispatchedAt,
        status: ExchangeStatus.EXCHANGE_SENT,
      },
    });

    await tx.returnRequest.update({
      where: { id: exchange.returnRequestId },
      data: {
        status: ReturnStatus.EXCHANGE_SENT,
        internalNotes: note
          ? [exchange.returnRequest.internalNotes, note]
              .filter(Boolean)
              .join("\n")
          : undefined,
      },
    });

    return next;
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "exchange.shipped",
    entityType: "exchange",
    entityId: exchange.id,
    beforeState: {
      courier: exchange.courier,
      trackingNumber: exchange.trackingNumber,
      trackingUrl: exchange.trackingUrl,
    },
    afterState: {
      courier: updated.courier,
      trackingNumber: updated.trackingNumber,
      trackingUrl: updated.trackingUrl,
      dispatchedAt: updated.dispatchedAt?.toISOString() ?? null,
    },
  });

  return updated;
}

export async function markExchangeDelivered(input: {
  exchangeId: string;
  userId: string;
  deliveredAt?: Date;
}) {
  const exchange = await db.exchange.findUniqueOrThrow({
    where: { id: input.exchangeId },
  });

  if (exchange.deliveredAt) {
    return exchange;
  }

  if (!exchange.dispatchedAt) {
    throw new Error("Exchange must be shipped before it can be marked delivered.");
  }

  const deliveredAt = input.deliveredAt ?? new Date();
  const now = new Date();

  if (deliveredAt.getTime() > now.getTime()) {
    throw new Error("Delivered date cannot be in the future.");
  }
  if (deliveredAt.getTime() < exchange.dispatchedAt.getTime()) {
    throw new Error("Delivered date cannot be earlier than the dispatch date.");
  }

  const updated = await db.exchange.update({
    where: { id: exchange.id },
    data: { deliveredAt },
  });

  await recordAuditEvent({
    actorId: input.userId,
    action: "exchange.delivered",
    entityType: "exchange",
    entityId: exchange.id,
    afterState: { deliveredAt: deliveredAt.toISOString() },
  });

  return updated;
}

export function canShowExchangeShipmentForm(status: ReturnStatus) {
  return EXCHANGE_SHIPMENT_STATUSES.has(status);
}

async function restockReturnedVariant(input: {
  variantId: string;
  quantity: number;
  returnId: string;
  actorId: string;
}) {
  const item = await db.inventoryItem.findUniqueOrThrow({
    where: { variantId: input.variantId },
    include: {
      levels: {
        orderBy: { location: { fulfilmentPriority: "desc" } },
        take: 1,
      },
    },
  });

  const level = item.levels[0];
  if (!level) {
    throw new Error("No inventory location found for returned variant.");
  }

  await db.$transaction(async (tx) => {
    await tx.inventoryLevel.update({
      where: { id: level.id },
      data: {
        onHand: { increment: input.quantity },
        version: { increment: 1 },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        inventoryItemId: item.id,
        locationId: level.locationId,
        quantityDelta: input.quantity,
        quantityBefore: level.onHand,
        quantityAfter: level.onHand + input.quantity,
        movementType: InventoryMovementType.INCREASE,
        reasonCode: InventoryMovementReason.RETURN_ACCEPTED,
        referenceType: "return_request",
        referenceId: input.returnId,
        administratorId: input.actorId,
        note: "Returned unit accepted back into sellable stock",
      },
    });
  });
}

export { ReturnStatus, ReturnDisposition, ExchangeStatus };
