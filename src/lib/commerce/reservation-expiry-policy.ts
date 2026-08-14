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
