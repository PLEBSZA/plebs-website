import "server-only";

import {
  InventoryMovementReason,
  InventoryMovementType,
  VariantStatus,
} from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/admin/audit";
import { db } from "@/lib/db";
import {
  calculateAvailableQuantity,
  calculateInventoryStatus,
} from "@/lib/commerce/inventory-status";
import type {
  InventoryMatrix,
  InventoryMatrixCell,
} from "@/lib/commerce/inventory-types";

export type { InventoryMatrix, InventoryMatrixCell } from "@/lib/commerce/inventory-types";

function assertNonNegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}

export async function getInventoryMatrix(productId?: string): Promise<InventoryMatrix> {
  const product = productId
    ? await db.product.findUniqueOrThrow({ where: { id: productId } })
    : await db.product.findFirstOrThrow({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      });

  const options = await db.productOption.findMany({
    where: { productId: product.id },
    include: {
      values: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  const colourOption = options.find((option) => option.code === "COLOUR");
  const sizeOption = options.find((option) => option.code === "SIZE");

  if (!colourOption || !sizeOption) {
    throw new Error("Product is missing Colour or Size options.");
  }

  const variants = await db.productVariant.findMany({
    where: {
      productId: product.id,
      status: { not: VariantStatus.ARCHIVED },
    },
    include: {
      colourValue: true,
      sizeValue: true,
      inventoryItem: {
        include: {
          levels: {
            include: { location: true },
            orderBy: { location: { fulfilmentPriority: "desc" } },
          },
        },
      },
    },
  });

  const cells: InventoryMatrixCell[] = [];

  for (const variant of variants) {
    const level = variant.inventoryItem?.levels[0];
    if (!variant.inventoryItem || !level) continue;

    const available = calculateAvailableQuantity(level.onHand, level.reserved);
    cells.push({
      variantId: variant.id,
      inventoryItemId: variant.inventoryItem.id,
      inventoryLevelId: level.id,
      sku: variant.sku,
      colourId: variant.colourValue.id,
      colourLabel: variant.colourValue.label,
      colourCode: variant.colourValue.code,
      colourOrder: variant.colourValue.displayOrder,
      sizeId: variant.sizeValue.id,
      sizeLabel: variant.sizeValue.label,
      sizeCode: variant.sizeValue.code,
      sizeOrder: variant.sizeValue.displayOrder,
      onHand: level.onHand,
      reserved: level.reserved,
      incoming: level.incoming,
      available,
      lowStockThreshold: level.lowStockThreshold,
      status: calculateInventoryStatus({
        available,
        incoming: level.incoming,
        lowStockThreshold: level.lowStockThreshold,
        variantActive: variant.status === VariantStatus.ACTIVE,
      }),
      locationId: level.locationId,
      locationCode: level.location.code,
      version: level.version,
      variantStatus: variant.status,
    });
  }

  cells.sort(
    (a, b) =>
      a.colourOrder - b.colourOrder ||
      a.colourLabel.localeCompare(b.colourLabel) ||
      a.sizeOrder - b.sizeOrder,
  );

  return {
    productId: product.id,
    productName: product.name,
    colours: colourOption.values.map((value) => ({
      id: value.id,
      label: value.label,
      code: value.code,
      displayOrder: value.displayOrder,
    })),
    sizes: sizeOption.values.map((value) => ({
      id: value.id,
      label: value.label,
      code: value.code,
      displayOrder: value.displayOrder,
    })),
    cells,
  };
}

export async function listInventoryMovements(input?: {
  inventoryItemId?: string;
  take?: number;
}) {
  return db.inventoryMovement.findMany({
    where: input?.inventoryItemId
      ? { inventoryItemId: input.inventoryItemId }
      : undefined,
    include: {
      location: true,
      administrator: {
        select: { id: true, name: true, email: true },
      },
      inventoryItem: {
        include: {
          variant: {
            select: {
              sku: true,
              colourValue: { select: { label: true } },
              sizeValue: { select: { label: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: input?.take ?? 50,
  });
}

export async function adjustInventoryByDelta(input: {
  inventoryLevelId: string;
  delta: number;
  reasonCode: InventoryMovementReason;
  note?: string;
  administratorId: string;
  expectedVersion?: number;
}) {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new Error("Delta must be a non-zero integer.");
  }

  return db.$transaction(async (tx) => {
    const level = await tx.inventoryLevel.findUniqueOrThrow({
      where: { id: input.inventoryLevelId },
      include: {
        inventoryItem: { include: { variant: true } },
      },
    });

    if (
      input.expectedVersion != null &&
      level.version !== input.expectedVersion
    ) {
      throw new Error(
        "Inventory changed while you were editing. Refresh and try again.",
      );
    }

    const quantityBefore = level.onHand;
    const quantityAfter = quantityBefore + input.delta;

    if (quantityAfter < 0) {
      throw new Error("Adjustment would make on-hand quantity negative.");
    }
    if (quantityAfter < level.reserved) {
      throw new Error(
        `Adjustment would leave on-hand below reserved quantity (${level.reserved}).`,
      );
    }

    const updated = await tx.inventoryLevel.update({
      where: { id: level.id },
      data: {
        onHand: quantityAfter,
        version: { increment: 1 },
      },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        inventoryItemId: level.inventoryItemId,
        locationId: level.locationId,
        quantityDelta: input.delta,
        quantityBefore,
        quantityAfter,
        movementType:
          input.delta > 0
            ? InventoryMovementType.INCREASE
            : InventoryMovementType.DECREASE,
        reasonCode: input.reasonCode,
        referenceType: "admin_adjustment",
        referenceId: level.id,
        note: input.note?.trim() || null,
        administratorId: input.administratorId,
      },
    });

    await recordAuditEvent({
      actorId: input.administratorId,
      action: "inventory.adjusted",
      entityType: "inventory_level",
      entityId: level.id,
      beforeState: {
        onHand: quantityBefore,
        reserved: level.reserved,
        version: level.version,
        sku: level.inventoryItem.variant.sku,
      },
      afterState: {
        onHand: updated.onHand,
        reserved: updated.reserved,
        version: updated.version,
        sku: level.inventoryItem.variant.sku,
      },
      reason: input.note ?? input.reasonCode,
    });

    return {
      level: updated,
      movement,
      available: calculateAvailableQuantity(updated.onHand, updated.reserved),
    };
  });
}

export async function adjustInventoryToCount(input: {

  inventoryLevelId: string;
  countedQuantity: number;
  reasonCode?: InventoryMovementReason;
  note?: string;
  administratorId: string;
  expectedVersion?: number;
}) {
  assertNonNegativeInteger(input.countedQuantity, "Counted quantity");

  const reasonCode =
    input.reasonCode ?? InventoryMovementReason.STOCK_RECOUNT;

  return db.$transaction(async (tx) => {
    const level = await tx.inventoryLevel.findUniqueOrThrow({
      where: { id: input.inventoryLevelId },
      include: {
        inventoryItem: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (
      input.expectedVersion != null &&
      level.version !== input.expectedVersion
    ) {
      throw new Error(
        "Inventory changed while you were editing. Refresh and try again.",
      );
    }

    const quantityBefore = level.onHand;
    const quantityAfter = input.countedQuantity;
    const quantityDelta = quantityAfter - quantityBefore;

    if (quantityAfter < level.reserved) {
      throw new Error(
        `Cannot set on-hand below reserved quantity (${level.reserved}).`,
      );
    }

    const updated = await tx.inventoryLevel.update({
      where: { id: level.id },
      data: {
        onHand: quantityAfter,
        version: { increment: 1 },
      },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        inventoryItemId: level.inventoryItemId,
        locationId: level.locationId,
        quantityDelta,
        quantityBefore,
        quantityAfter,
        movementType:
          quantityDelta === 0
            ? InventoryMovementType.RECOUNT
            : quantityDelta > 0
              ? InventoryMovementType.INCREASE
              : InventoryMovementType.DECREASE,
        reasonCode,
        referenceType: "admin_adjustment",
        referenceId: level.id,
        note: input.note?.trim() || null,
        administratorId: input.administratorId,
      },
    });

    await recordAuditEvent({
      actorId: input.administratorId,
      action: "inventory.adjusted",
      entityType: "inventory_level",
      entityId: level.id,
      beforeState: {
        onHand: quantityBefore,
        reserved: level.reserved,
        version: level.version,
        sku: level.inventoryItem.variant.sku,
      },
      afterState: {
        onHand: updated.onHand,
        reserved: updated.reserved,
        version: updated.version,
        sku: level.inventoryItem.variant.sku,
      },
      reason: input.note ?? reasonCode,
    });

    return {
      level: updated,
      movement,
      available: calculateAvailableQuantity(updated.onHand, updated.reserved),
    };
  });
}

export async function getDashboardInventorySummary() {
  const matrix = await getInventoryMatrix();
  const sizeS = matrix.cells.find((cell) => cell.sizeCode === "S");
  return {
    lowStock: matrix.cells.filter((cell) => cell.status === "low_stock"),
    outOfStock: matrix.cells.filter((cell) => cell.status === "out_of_stock"),
    sizeSAvailable: sizeS?.available ?? 0,
    sizeSSku: sizeS?.sku ?? null,
  };
}
