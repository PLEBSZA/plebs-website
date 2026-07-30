"use server";

import { revalidatePath } from "next/cache";
import { InventoryMovementReason } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin/dal";
import {
  adjustInventoryByDelta,
  adjustInventoryToCount,
} from "@/lib/commerce/inventory-service";
import { revalidateStorefrontCatalogue } from "@/lib/commerce/revalidate-storefront";
import { inventoryAdjustmentSchema } from "@/lib/validation/inventory";

export type InventoryActionState = {
  ok?: boolean;
  error?: string;
};

export async function adjustInventoryAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const user = await requireAdminSession("inventory:write");

  const parsed = inventoryAdjustmentSchema.safeParse({
    inventoryLevelId: formData.get("inventoryLevelId"),
    mode: formData.get("mode"),
    quantity: Number(formData.get("quantity")),
    reasonCode: formData.get("reasonCode"),
    note: formData.get("note") || undefined,
    expectedVersion: formData.get("expectedVersion")
      ? Number(formData.get("expectedVersion"))
      : undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid inventory adjustment.",
    };
  }

  const allowedReasons = new Set<InventoryMovementReason>([
    InventoryMovementReason.OPENING_BALANCE,
    InventoryMovementReason.STOCK_RECOUNT,
    InventoryMovementReason.MANUAL_CORRECTION,
    InventoryMovementReason.DAMAGED,
    InventoryMovementReason.SAMPLE_ALLOCATION,
    InventoryMovementReason.PHOTOSHOOT_ALLOCATION,
  ]);

  if (!allowedReasons.has(parsed.data.reasonCode)) {
    return { error: "Select a valid adjustment reason." };
  }

  try {
    if (parsed.data.mode === "delta") {
      await adjustInventoryByDelta({
        inventoryLevelId: parsed.data.inventoryLevelId,
        delta: parsed.data.quantity,
        reasonCode: parsed.data.reasonCode,
        note: parsed.data.note,
        administratorId: user.id,
        expectedVersion: parsed.data.expectedVersion,
      });
    } else {
      await adjustInventoryToCount({
        inventoryLevelId: parsed.data.inventoryLevelId,
        countedQuantity: parsed.data.quantity,
        reasonCode: parsed.data.reasonCode,
        note: parsed.data.note,
        administratorId: user.id,
        expectedVersion: parsed.data.expectedVersion,
      });
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to adjust inventory.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/history");
  revalidateStorefrontCatalogue();
  return { ok: true };
}
