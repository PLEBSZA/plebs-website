import type { InventoryAvailabilityStatus } from "@/lib/commerce/inventory-status";

export type InventoryMatrixCell = {
  variantId: string;
  inventoryItemId: string;
  inventoryLevelId: string;
  sku: string;
  colourId: string;
  colourLabel: string;
  colourCode: string;
  colourOrder: number;
  sizeId: string;
  sizeLabel: string;
  sizeCode: string;
  sizeOrder: number;
  onHand: number;
  reserved: number;
  incoming: number;
  available: number;
  lowStockThreshold: number;
  status: InventoryAvailabilityStatus;
  locationId: string;
  locationCode: string;
  version: number;
  variantStatus: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

export type InventoryMatrix = {
  productId: string;
  productName: string;
  colours: Array<{
    id: string;
    label: string;
    code: string;
    displayOrder: number;
  }>;
  sizes: Array<{
    id: string;
    label: string;
    code: string;
    displayOrder: number;
  }>;
  cells: InventoryMatrixCell[];
};
