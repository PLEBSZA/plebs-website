"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/dal";
import {
  createReturnRequest,
  updateReturnStatus,
  ReturnStatus,
  ReturnDisposition,
} from "@/lib/commerce/returns-service";

export type ReturnActionState = {
  error?: string;
  ok?: boolean;
};

const createReturnSchema = z.object({
  orderId: z.string().min(1),
  orderItemId: z.string().min(1),
  reason: z.string().min(1),
  customerComments: z.string().optional(),
  replacementVariantId: z.string().optional(),
});

export async function createReturnAction(
  _prev: ReturnActionState,
  formData: FormData,
): Promise<ReturnActionState> {
  const user = await requireAdminSession("returns:manage");
  const parsed = createReturnSchema.safeParse({
    orderId: formData.get("orderId"),
    orderItemId: formData.get("orderItemId"),
    reason: formData.get("reason"),
    customerComments: formData.get("customerComments") || undefined,
    replacementVariantId: formData.get("replacementVariantId") || undefined,
  });

  if (!parsed.success) {
    return { error: "Check the return details and try again." };
  }

  try {
    await createReturnRequest({
      ...parsed.data,
      actorId: user.id,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create return.",
    };
  }

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/returns");
  return { ok: true };
}

export async function updateReturnStatusAction(
  _prev: ReturnActionState,
  formData: FormData,
): Promise<ReturnActionState> {
  const user = await requireAdminSession("returns:manage");
  const returnId = String(formData.get("returnId") ?? "");
  const status = String(formData.get("status") ?? "") as ReturnStatus;

  if (!returnId || !Object.values(ReturnStatus).includes(status)) {
    return { error: "Invalid return or status." };
  }

  const disposition =
    (formData.get("disposition") as ReturnDisposition) || undefined;

  try {
    await updateReturnStatus({
      returnId,
      status,
      actorId: user.id,
      returnTracking: (formData.get("returnTracking") as string) || undefined,
      inspectionOutcome:
        (formData.get("inspectionOutcome") as string) || undefined,
      disposition:
        disposition && Object.values(ReturnDisposition).includes(disposition)
          ? disposition
          : undefined,
      resolution: (formData.get("resolution") as string) || undefined,
      internalNotes: (formData.get("internalNotes") as string) || undefined,
    });
  } catch (error) {
    return {
      error: error instanceof Error
        ? error.message
        : "Unable to update return.",
    };
  }

  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath("/admin/returns");
  revalidatePath("/admin/inventory");
  return { ok: true };
}
