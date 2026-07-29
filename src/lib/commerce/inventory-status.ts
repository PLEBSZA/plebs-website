export type InventoryAvailabilityStatus =
  | "in_stock"
  | "low_stock"
  | "awaiting_restock"
  | "out_of_stock"
  | "inactive";

export function calculateAvailableQuantity(onHand: number, reserved: number) {
  return Math.max(0, onHand - reserved);
}

export function calculateInventoryStatus(input: {
  available: number;
  incoming: number;
  lowStockThreshold: number;
  variantActive: boolean;
}): InventoryAvailabilityStatus {
  if (!input.variantActive) return "inactive";
  if (input.available > input.lowStockThreshold) return "in_stock";
  if (input.available > 0) return "low_stock";
  if (input.incoming > 0) return "awaiting_restock";
  return "out_of_stock";
}

export function inventoryStatusLabel(status: InventoryAvailabilityStatus) {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "low_stock":
      return "Low stock";
    case "awaiting_restock":
      return "Awaiting restock";
    case "out_of_stock":
      return "Out of stock";
    case "inactive":
      return "Inactive";
  }
}
