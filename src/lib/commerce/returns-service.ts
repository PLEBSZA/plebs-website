import "server-only";

import {
  ExchangeStatus,
  FulfilmentStatus,
  InventoryMovementReason,
  InventoryMovementType,
  ReturnDisposition,
  ReturnStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import { db } from "@/lib/db";

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

  if (order.fulfilmentStatus !== FulfilmentStatus.FULFILLED) {
    throw new Error("Returns can only be created for fulfilled orders.");
  }

  const item = order.items.find((entry) => entry.id === input.orderItemId);
  if (!item) {
    throw new Error("Order item not found on this order.");
  }

  const returnRequest = await db.returnRequest.create({
    data: {
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
