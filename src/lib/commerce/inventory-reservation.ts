import "server-only";

import {
  InventoryMovementReason,
  InventoryMovementType,
  ReservationStatus,
  VariantStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { calculateAvailableQuantity } from "@/lib/commerce/inventory-status";
import { findStorefrontVariant, getStorefrontCatalogue } from "@/lib/commerce/storefront-product";
import { revalidateStorefrontCatalogue } from "@/lib/commerce/revalidate-storefront";
import { shouldDecrementReservedAfterOrphanClaim, shouldSkipExpiryForPaidOrder, reservationExpiryScope, type ReservationExpiryScope } from "@/lib/commerce/reservation-expiry-policy";
import { RESERVATION_CRON_BATCH } from "@/lib/cron/config";

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

export type InventoryTx = Prisma.TransactionClient;

export const RESERVATION_TTL_MS = 1000 * 60 * 60 * 24;
export const PAID_AFTER_EXPIRED_RESERVATION_NOTE =
  "Paid after reservation expiry; stock could not be re-reserved. Owner review required.";

export type ReservationResult =
  | { ok: true; available: number; reservationId: string }
  | { ok: false; available: number; message: string };

export async function reserveStockWithClient(
  tx: InventoryTx,
  input: { orderId: string; variantId: string; quantity: number },
): Promise<ReservationResult> {
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
      ok: false,
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
      ok: false,
      available: 0,
      message: "Stock changed while checkout was processing. Please try again.",
    };
  }

  const reservation = await tx.inventoryReservation.create({
    data: {
      inventoryItemId: inventoryItem.id,
      locationId: level.locationId,
      orderId: input.orderId,
      quantity: input.quantity,
      status: ReservationStatus.ACTIVE,
      expiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
    },
  });

  return { ok: true, available: available - input.quantity, reservationId: reservation.id };
}

async function claimAndReleaseOrphanReservation(tx: InventoryTx, id: string) {
  const claimed = await tx.inventoryReservation.updateMany({
    where: {
      id,
      orderId: null,
      status: ReservationStatus.ACTIVE,
      expiresAt: { lte: new Date() },
    },
    data: {
      status: ReservationStatus.RELEASED,
      releasedAt: new Date(),
    },
  });
  if (!shouldDecrementReservedAfterOrphanClaim(claimed.count)) return false;

  const reservation = await tx.inventoryReservation.findUnique({
    where: { id },
  });
  if (!reservation) return false;

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
  return true;
}

export async function releaseOrderReservationWithClient(
  tx: InventoryTx,
  orderId: string,
) {
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
}

export async function syncOrderReservationWithClient(
  tx: InventoryTx,
  input: { orderId: string; variantId: string; quantity: number },
): Promise<ReservationResult> {
  const active = await tx.inventoryReservation.findMany({
    where: {
      orderId: input.orderId,
      status: ReservationStatus.ACTIVE,
    },
  });

  if (active.length === 0) {
    return reserveStockWithClient(tx, input);
  }

  const inventoryItem = await tx.inventoryItem.findUniqueOrThrow({
    where: { variantId: input.variantId },
  });

  const current = active[0];
  const needsVariantSwitch =
    active.length > 1 || current.inventoryItemId !== inventoryItem.id;

  if (needsVariantSwitch) {
    await releaseOrderReservationWithClient(tx, input.orderId);
    return reserveStockWithClient(tx, input);
  }

  const delta = input.quantity - current.quantity;
  if (delta === 0) {
    return {
      ok: true,
      available: 0,
      reservationId: current.id,
    };
  }

  const level = await tx.inventoryLevel.findUniqueOrThrow({
    where: {
      inventoryItemId_locationId: {
        inventoryItemId: current.inventoryItemId,
        locationId: current.locationId,
      },
    },
  });

  if (delta > 0) {
    const available = calculateAvailableQuantity(level.onHand, level.reserved);
    if (available < delta) {
      return {
        ok: false,
        available,
        message:
          available === 0
            ? `Unfortunately Size ${inventoryItem.id} became unavailable before your purchase completed.`
            : `Only ${available} extra unit${available === 1 ? "" : "s"} remain available.`,
      };
    }

    const updated = await tx.inventoryLevel.updateMany({
      where: {
        id: level.id,
        version: level.version,
        onHand: { gte: level.reserved + delta },
      },
      data: {
        reserved: { increment: delta },
        version: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      return {
        ok: false,
        available: 0,
        message:
          "Stock changed while checkout was processing. Please try again.",
      };
    }
  } else {
    await tx.inventoryLevel.update({
      where: { id: level.id },
      data: {
        reserved: { decrement: -delta },
        version: { increment: 1 },
      },
    });
  }

  await tx.inventoryReservation.update({
    where: { id: current.id },
    data: { quantity: input.quantity },
  });

  return {
    ok: true,
    available: 0,
    reservationId: current.id,
  };
}

export async function reserveStockForOrder(input: {
  orderId: string;
  variantId: string;
  quantity: number;
}) {
  const result = await db.$transaction((tx) =>
    reserveStockWithClient(tx, input),
  );

  if (result.ok) {
    revalidateStorefrontCatalogue();
  }

  return result;
}

export async function releaseOrderReservation(orderId: string) {
  await db.$transaction((tx) => releaseOrderReservationWithClient(tx, orderId));
  revalidateStorefrontCatalogue();
}

export async function convertOrderReservationWithClient(
  tx: InventoryTx,
  orderId: string,
) {
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
}

export async function convertOrderReservation(orderId: string) {
  await db.$transaction((tx) => convertOrderReservationWithClient(tx, orderId));
  revalidateStorefrontCatalogue();
}

export async function settlePaidOrderReservationWithClient(
  tx: InventoryTx,
  orderId: string,
): Promise<{ converted: boolean; restockRequired: boolean }> {
  const active = await tx.inventoryReservation.findMany({
    where: { orderId, status: ReservationStatus.ACTIVE },
  });

  if (active.length > 0) {
    await convertOrderReservationWithClient(tx, orderId);
    return { converted: true, restockRequired: false };
  }

  const alreadyConverted = await tx.inventoryReservation.count({
    where: { orderId, status: ReservationStatus.CONVERTED },
  });
  if (alreadyConverted > 0) {
    return { converted: true, restockRequired: false };
  }

  const item = await tx.orderItem.findFirst({
    where: { orderId },
    select: { variantId: true, quantity: true },
  });
  if (!item?.variantId) {
    return { converted: false, restockRequired: true };
  }

  const reserved = await reserveStockWithClient(tx, {
    orderId,
    variantId: item.variantId,
    quantity: item.quantity,
  });
  if (!reserved.ok) {
    return { converted: false, restockRequired: true };
  }

  await convertOrderReservationWithClient(tx, orderId);
  return { converted: true, restockRequired: false };
}

/**
 * Releases ACTIVE reservations whose expiresAt has passed, but only when the
 * related order is not already paid. Payment after expiry re-reserves or
 * flags the order for owner review instead of converting missing stock.
 */
export async function expireAbandonedReservations(
  limit = RESERVATION_CRON_BATCH,
  scope?: ReservationExpiryScope,
) {
  const expired = await db.inventoryReservation.findMany({
    where: {
      status: ReservationStatus.ACTIVE,
      expiresAt: { lte: new Date() },
      ...reservationExpiryScope(scope),
    },
    select: { id: true, orderId: true },
    take: limit,
    orderBy: { expiresAt: "asc" },
  });

  const orderIds = [
    ...new Set(
      expired
        .map((entry) => entry.orderId)
        .filter((orderId): orderId is string => Boolean(orderId)),
    ),
  ];
  const orphanIds = expired
    .filter((entry) => !entry.orderId)
    .map((entry) => entry.id);

  let released = 0;

  for (const orderId of orderIds) {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true },
      });
      if (!order || shouldSkipExpiryForPaidOrder(order.paymentStatus)) {
        return false;
      }
      const stillExpired = await tx.inventoryReservation.count({
        where: {
          orderId,
          status: ReservationStatus.ACTIVE,
          expiresAt: { lte: new Date() },
        },
      });
      if (stillExpired === 0) return false;
      await releaseOrderReservationWithClient(tx, orderId);
      return true;
    });
    if (result) released += 1;
  }

  for (const id of orphanIds) {
    const claimed = await db.$transaction((tx) =>
      claimAndReleaseOrphanReservation(tx, id),
    );
    if (claimed) released += 1;
  }

  if (released > 0) {
    revalidateStorefrontCatalogue();
  }

  return { examined: expired.length, released };
}

/**
 * Bounded recovery for Hobby: only runs after a failed reservation, and only
 * when expired ACTIVE rows may be holding stock for this variant. Successful
 * checkouts never pay this cost. Cleanup is outside the checkout transaction
 * so the original reservation lock stays small; checkout then retries once.
 */
export async function recoverExpiredReservationsIfBlocking(input: {
  colour: string;
  size: string;
  limit?: number;
}) {
  const variant = await findStorefrontVariant({
    colour: input.colour,
    size: input.size,
  });
  if (!variant?.id) {
    return { examined: 0, released: 0, attempted: false };
  }

  const blocking = await db.inventoryReservation.count({
    where: {
      status: ReservationStatus.ACTIVE,
      expiresAt: { lte: new Date() },
      inventoryItem: { variantId: variant.id },
    },
  });
  if (blocking === 0) {
    return { examined: 0, released: 0, attempted: false };
  }

  const result = await expireAbandonedReservations(
    input.limit ?? RESERVATION_CRON_BATCH,
    { variantId: variant.id },
  );
  return { ...result, attempted: true };
}
