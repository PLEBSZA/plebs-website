"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/dal";
import {
  createProductionBatch,
  receiveProductionBatch,
} from "@/lib/commerce/batch-service";
import { getInventoryMatrix } from "@/lib/commerce/inventory-service";

export type BatchActionState = {
  error?: string;
  ok?: boolean;
};

const createSchema = z.object({
  batchNumber: z.string().min(3),
  supplier: z.string().optional(),
  manufacturer: z.string().optional(),
  colourOrFabricLot: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  freightCost: z.string().optional(),
  notes: z.string().optional(),
});

export async function createBatchAction(
  _prev: BatchActionState,
  formData: FormData,
): Promise<BatchActionState> {
  const user = await requireAdminSession("inventory:write");
  const parsed = createSchema.safeParse({
    batchNumber: formData.get("batchNumber"),
    supplier: formData.get("supplier") || undefined,
    manufacturer: formData.get("manufacturer") || undefined,
    colourOrFabricLot: formData.get("colourOrFabricLot") || undefined,
    expectedDeliveryDate: formData.get("expectedDeliveryDate") || undefined,
    freightCost: formData.get("freightCost") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Check the batch details and try again." };
  }

  const matrix = await getInventoryMatrix();
  const lines = matrix.cells
    .map((cell) => {
      const raw = formData.get(`qty_${cell.variantId}`);
      const quantityOrdered = Number(raw ?? 0);
      return {
        variantId: cell.variantId,
        quantityOrdered: Number.isFinite(quantityOrdered) ? quantityOrdered : 0,
      };
    })
    .filter((line) => line.quantityOrdered > 0);

  try {
    const batch = await createProductionBatch({
      batchNumber: parsed.data.batchNumber,
      supplier: parsed.data.supplier,
      manufacturer: parsed.data.manufacturer,
      colourOrFabricLot: parsed.data.colourOrFabricLot,
      expectedDeliveryDate: parsed.data.expectedDeliveryDate,
      freightCost: parsed.data.freightCost
        ? Number(parsed.data.freightCost)
        : undefined,
      notes: parsed.data.notes,
      createdById: user.id,
      lines,
    });
    revalidatePath("/admin/batches");
    revalidatePath("/admin/inventory");
    redirect(`/admin/batches/${batch.id}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : "Unable to create batch.",
    };
  }
}

export async function receiveBatchAction(
  _prev: BatchActionState,
  formData: FormData,
): Promise<BatchActionState> {
  const user = await requireAdminSession("inventory:write");
  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) return { error: "Missing batch." };

  const lineIds = formData.getAll("lineItemId").map(String);
  const lines = lineIds.map((lineItemId) => ({
    lineItemId,
    quantityReceived: Number(formData.get(`received_${lineItemId}`) ?? 0),
    quantityRejected: Number(formData.get(`rejected_${lineItemId}`) ?? 0),
  }));

  try {
    await receiveProductionBatch({
      batchId,
      administratorId: user.id,
      lines,
      note: String(formData.get("note") ?? "") || undefined,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to receive batch.",
    };
  }

  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/history");
  return { ok: true };
}
