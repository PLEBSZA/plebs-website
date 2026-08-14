/**
 * Orphan expiry must claim ACTIVE → RELEASED before decrementing reserved
 * stock. A second claim on the same row must not decrement again.
 */
export function shouldDecrementReservedAfterOrphanClaim(claimedCount: number) {
  return claimedCount === 1;
}

export function applyOrphanReservedDecrement(
  reserved: number,
  quantity: number,
  claimedCount: number,
) {
  if (!shouldDecrementReservedAfterOrphanClaim(claimedCount)) return reserved;
  return Math.max(0, reserved - quantity);
}

export function shouldSkipExpiryForPaidOrder(paymentStatus: string) {
  return paymentStatus === "PAID";
}

export type ReservationExpiryScope = {
  variantId?: string;
  inventoryItemId?: string;
};

/**
 * Cron cleanup stays global. Checkout recovery must name the blocked
 * variant or inventory item so a 25-row batch cannot skip it.
 */
export function reservationExpiryScope(scope?: ReservationExpiryScope) {
  if (scope?.inventoryItemId) {
    return { inventoryItemId: scope.inventoryItemId };
  }
  if (scope?.variantId) {
    return { inventoryItem: { variantId: scope.variantId } };
  }
  return {};
}
