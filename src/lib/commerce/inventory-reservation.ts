import "server-only";

import {
  InventoryMovementReason,
  InventoryMovementType,
  ReservationStatus,
  VariantStatus,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { calculateAvailableQuantity } from "@/lib/commerce/inventory-status";
import { findStorefrontVariant, getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import { revalidateStorefrontCatalogue } from "@/lib/commerce/revalidate-storefront";

export async function getStockQuantity(sizeNameOrId: string): Promise<number> {
  const catalogue = await getStorefrontCatalogue();
  const size = catalogue.sizes.find(
    (entry) =>
      entry.id.toLowerCase() === sizeNameOrId.toLowerCase() ||
      entry.name.toLowerCase() === sizeNameOrId.toLowerCase(),
  );
  return size?.stockQuantity ?? 0;
}

export async function isSizeInStock(sizeNameOrId: string, quantity = 1) {
  return (await getStockQuantity(sizeNameOrId)) >= quantity;
}

export async function getInventorySnapshot() {
  const catalogue = await getStorefrontCatalogue();
  return catalogue.sizes.map((size) => ({
    id: size.id,
    name: size.name,
    available: size.available && size.stockQuantity > 0,
    stockQuantity: size.stockQuantity,
    sku: size.sku,
    variantId: size.variantId,
  }));
}

export async function validatePurchaseQuantity(input: {
  colour: string;
  size: string;
  quantity: number;
}) {
  const variant = await findStorefrontVariant({
    colour: input.colour,
    size: input.size,
  });

  if (!variant || variant.status !== VariantStatus.ACTIVE) {
    return {
      ok: false as const,
      available: 0,
      message: "Please choose a valid in-stock size.",
      variant: null,
    };
  }

  if (input.quantity < 1) {
    return {
      ok: false as const,
      available: variant.available,
      message: "Quantity must be at least 1.",
      variant,
    };
  }

  if (variant.available < input.quantity) {
    return {
      ok: false as const,
      available: variant.available,
      message:
        variant.available === 0
          ? `Unfortunately Size ${variant.sizeName} became unavailable before your purchase completed.`
          : `Only ${variant.available} Size ${variant.sizeName} dungaree${variant.available === 1 ? "" : "s"} remain available.`,
      variant,
    };
  }

  return {
    ok: true as const,
    available: variant.available,
    variant,
  };
}

export async function reserveStockForOrder(input: {
  orderId: string;
  variantId: string;
  quantity: number;
}) {
  const result = await db.$transaction(async (tx) => {
    const inventoryItem = await tx.inventoryItem.findUniqueOrThrow({
      where: { variantId: input.variantId },
      include: {
        levels: {
          orderBy: { location: { fulfilmentPriority: "desc" } },
          take: 1,
        },
        variant: true,
      },
    });

    const level = inventoryItem.levels[0];
    if (!level) {
      throw new Error("No stock location is configured for this variant.");
    }

    const available = calculateAvailableQuantity(level.onHand, level.reserved);

    if (available < input.quantity) {
      return {
        ok: false as const,
        available,
        message:
          available === 0
            ? `Unfortunately Size ${inventoryItem.variant.sku} became unavailable before your purchase completed.`
            : `Only ${available} unit${available === 1 ? "" : "s"} remain available.`,
      };
    }

    const updated = await tx.inventoryLevel.updateMany({
      where: {
        id: level.id,
        version: level.version,
        onHand: { gte: level.reserved + input.quantity },
      },
      data: {
        reserved: { increment: input.quantity },
        version: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      return {
        ok: false as const,
        available: 0,
        message:
          "Stock changed while checkout was processing. Please try again.",
      };
    }

    const reservation = await tx.inventoryReservation.create({
      data: {
        inventoryItemId: inventoryItem.id,
        locationId: level.locationId,
        orderId: input.orderId,
        quantity: input.quantity,
        status: ReservationStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    return {
      ok: true as const,
      available: available - input.quantity,
      reservationId: reservation.id,
    };
  });

  if (result.ok) {
    revalidateStorefrontCatalogue();
  }

  return result;
}

export async function releaseOrderReservation(orderId: string) {
  await db.$transaction(async (tx) => {
    const reservations = await tx.inventoryReservation.findMany({
      where: {
        orderId,
        status: ReservationStatus.ACTIVE,
      },
    });

    for (const reservation of reservations) {
      await tx.inventoryLevel.update({
        where: {
          inventoryItemId_locationId: {
            inventoryItemId: reservation.inventoryItemId,
            locationId: reservation.locationId,
          },
        },
        data: {
          reserved: { decrement: reservation.quantity },
          version: { increment: 1 },
        },
      });

      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.RELEASED,
          releasedAt: new Date(),
        },
      });
    }
  });

  revalidateStorefrontCatalogue();
}

export async function convertOrderReservation(orderId: string) {
  await db.$transaction(async (tx) => {
    const reservations = await tx.inventoryReservation.findMany({
      where: {
        orderId,
        status: ReservationStatus.ACTIVE,
      },
    });

    for (const reservation of reservations) {
      const level = await tx.inventoryLevel.findUniqueOrThrow({
        where: {
          inventoryItemId_locationId: {
            inventoryItemId: reservation.inventoryItemId,
            locationId: reservation.locationId,
          },
        },
      });

      if (level.onHand < reservation.quantity || level.reserved < reservation.quantity) {
        throw new Error("Cannot convert reservation due to inconsistent stock.");
      }

      await tx.inventoryLevel.update({
        where: { id: level.id },
        data: {
          onHand: { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity },
          version: { increment: 1 },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: reservation.inventoryItemId,
          locationId: reservation.locationId,
          quantityDelta: -reservation.quantity,
          quantityBefore: level.onHand,
          quantityAfter: level.onHand - reservation.quantity,
          movementType: InventoryMovementType.DECREASE,
          reasonCode: InventoryMovementReason.CUSTOMER_ORDER,
          referenceType: "order",
          referenceId: orderId,
        },
      });

      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CONVERTED,
          convertedAt: new Date(),
        },
      });
    }
  });

  revalidateStorefrontCatalogue();
}
