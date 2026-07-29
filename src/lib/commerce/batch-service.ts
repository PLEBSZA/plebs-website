import "server-only";

import {
  BatchStatus,
  InventoryMovementReason,
  InventoryMovementType,
  QualityControlStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import { db } from "@/lib/db";

export async function listProductionBatches() {
  return db.productionBatch.findMany({
    include: {
      lineItems: {
        include: {
          variant: {
            include: {
              colourValue: true,
              sizeValue: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductionBatch(id: string) {
  return db.productionBatch.findUnique({
    where: { id },
    include: {
      lineItems: {
        include: {
          variant: {
            include: {
              colourValue: true,
              sizeValue: true,
              inventoryItem: {
                include: {
                  levels: {
                    orderBy: { location: { fulfilmentPriority: "desc" } },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          variant: {
            sizeValue: {
              displayOrder: "asc",
            },
          },
        },
      },
    },
  });
}

export async function createProductionBatch(input: {
  batchNumber: string;
  supplier?: string;
  manufacturer?: string;
  colourOrFabricLot?: string;
  expectedDeliveryDate?: string;
  freightCost?: number;
  notes?: string;
  createdById: string;
  lines: Array<{
    variantId: string;
    quantityOrdered: number;
    unitCost?: number;
  }>;
}) {
  if (!input.batchNumber.trim()) {
    throw new Error("Batch number is required.");
  }
  if (input.lines.length === 0) {
    throw new Error("Add at least one size line to the batch.");
  }

  for (const line of input.lines) {
    if (!Number.isInteger(line.quantityOrdered) || line.quantityOrdered < 0) {
      throw new Error("Ordered quantities must be non-negative integers.");
    }
  }

  const batch = await db.$transaction(async (tx) => {
    const created = await tx.productionBatch.create({
      data: {
        batchNumber: input.batchNumber.trim().toUpperCase(),
        status: BatchStatus.ORDERED,
        supplier: input.supplier?.trim() || null,
        manufacturer: input.manufacturer?.trim() || null,
        colourOrFabricLot: input.colourOrFabricLot?.trim() || null,
        expectedDeliveryDate: input.expectedDeliveryDate
          ? new Date(input.expectedDeliveryDate)
          : null,
        freightCost:
          input.freightCost != null ? input.freightCost.toFixed(2) : null,
        notes: input.notes?.trim() || null,
        createdById: input.createdById,
        qualityControlStatus: QualityControlStatus.PENDING,
        lineItems: {
          create: input.lines.map((line) => ({
            variantId: line.variantId,
            quantityOrdered: line.quantityOrdered,
            unitCost:
              line.unitCost != null ? line.unitCost.toFixed(2) : null,
          })),
        },
      },
      include: { lineItems: true },
    });

    for (const line of created.lineItems) {
      if (line.quantityOrdered <= 0) continue;
      const item = await tx.inventoryItem.findUnique({
        where: { variantId: line.variantId },
        include: {
          levels: {
            orderBy: { location: { fulfilmentPriority: "desc" } },
            take: 1,
          },
        },
      });
      const level = item?.levels[0];
      if (!level) continue;
      await tx.inventoryLevel.update({
        where: { id: level.id },
        data: {
          incoming: { increment: line.quantityOrdered },
          version: { increment: 1 },
        },
      });
    }

    return created;
  });

  await recordAuditEvent({
    actorId: input.createdById,
    action: "batch.created",
    entityType: "production_batch",
    entityId: batch.id,
    afterState: {
      batchNumber: batch.batchNumber,
      lines: batch.lineItems.length,
    },
  });

  return batch;
}

export async function receiveProductionBatch(input: {
  batchId: string;
  administratorId: string;
  lines: Array<{
    lineItemId: string;
    quantityReceived: number;
    quantityRejected: number;
  }>;
  note?: string;
}) {
  return db.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUniqueOrThrow({
      where: { id: input.batchId },
      include: { lineItems: true },
    });

    if (
      batch.status === BatchStatus.CLOSED ||
      batch.status === BatchStatus.CANCELLED
    ) {
      throw new Error("This batch can no longer be received.");
    }

    for (const receipt of input.lines) {
      const line = batch.lineItems.find((entry) => entry.id === receipt.lineItemId);
      if (!line) throw new Error("Unknown batch line item.");

      if (
        !Number.isInteger(receipt.quantityReceived) ||
        receipt.quantityReceived < 0 ||
        !Number.isInteger(receipt.quantityRejected) ||
        receipt.quantityRejected < 0
      ) {
        throw new Error("Received and rejected quantities must be non-negative integers.");
      }

      if (receipt.quantityRejected > receipt.quantityReceived) {
        throw new Error("Rejected quantity cannot exceed received quantity.");
      }

      const accepted = receipt.quantityReceived - receipt.quantityRejected;
      const previousAccepted = line.quantityAccepted;
      const acceptedDelta = accepted - previousAccepted;
      const orderedDelta = line.quantityOrdered - line.quantityAccepted;

      const item = await tx.inventoryItem.findUniqueOrThrow({
        where: { variantId: line.variantId },
        include: {
          levels: {
            orderBy: { location: { fulfilmentPriority: "desc" } },
            take: 1,
          },
        },
      });
      const level = item.levels[0];
      if (!level) throw new Error("Missing inventory level for batch variant.");

      const incomingReduction = Math.max(
        0,
        Math.min(level.incoming, Math.max(orderedDelta, acceptedDelta)),
      );

      await tx.batchLineItem.update({
        where: { id: line.id },
        data: {
          quantityReceived: receipt.quantityReceived,
          quantityRejected: receipt.quantityRejected,
          quantityAccepted: accepted,
        },
      });

      if (acceptedDelta !== 0 || incomingReduction > 0) {
        const quantityBefore = level.onHand;
        const quantityAfter = quantityBefore + Math.max(0, acceptedDelta);

        await tx.inventoryLevel.update({
          where: { id: level.id },
          data: {
            onHand: quantityAfter,
            incoming: Math.max(0, level.incoming - incomingReduction),
            version: { increment: 1 },
          },
        });

        if (acceptedDelta > 0) {
          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: item.id,
              locationId: level.locationId,
              quantityDelta: acceptedDelta,
              quantityBefore,
              quantityAfter,
              movementType: InventoryMovementType.INCREASE,
              reasonCode: InventoryMovementReason.BATCH_RECEIPT,
              referenceType: "production_batch",
              referenceId: batch.id,
              note: input.note?.trim() || null,
              administratorId: input.administratorId,
            },
          });
        }
      }
    }

    const refreshed = await tx.batchLineItem.findMany({
      where: { batchId: batch.id },
    });

    const fullyReceived = refreshed.every(
      (line) => line.quantityAccepted + line.quantityRejected >= line.quantityOrdered,
    );
    const anyReceived = refreshed.some((line) => line.quantityReceived > 0);

    const updated = await tx.productionBatch.update({
      where: { id: batch.id },
      data: {
        status: fullyReceived
          ? BatchStatus.RECEIVED
          : anyReceived
            ? BatchStatus.PARTIALLY_RECEIVED
            : batch.status,
        receivedDate: new Date(),
        qualityControlStatus: refreshed.some((line) => line.quantityRejected > 0)
          ? QualityControlStatus.PARTIALLY_ACCEPTED
          : QualityControlStatus.PASSED,
      },
    });

    await recordAuditEvent({
      actorId: input.administratorId,
      action: "batch.received",
      entityType: "production_batch",
      entityId: batch.id,
      afterState: {
        status: updated.status,
        lines: refreshed.map((line) => ({
          id: line.id,
          accepted: line.quantityAccepted,
          rejected: line.quantityRejected,
          received: line.quantityReceived,
        })),
      },
      reason: input.note,
    });

    return updated;
  });
}
