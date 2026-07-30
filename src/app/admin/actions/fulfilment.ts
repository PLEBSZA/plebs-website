"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/dal";
import {
  markOrderPacked,
  fulfilOrder,
  cancelOrderAdmin,
  markOrderDelivered,
  completeOrder,
  reopenOrder,
  updateFulfilmentTracking,
} from "@/lib/commerce/fulfilment-service";
import { sendFulfilmentDispatchedEmail } from "@/lib/email/fulfilment-emails";

export type FulfilmentActionState = {
  error?: string;
  ok?: boolean;
  message?: string;
  warning?: string;
};

export async function packOrderAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return { error: "Missing order." };

  try {
    await markOrderPacked({ orderId, userId: user.id });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to pack order.",
    };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

const fulfilSchema = z.object({
  orderId: z.string().min(1),
  courier: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function fulfilOrderAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const parsed = fulfilSchema.safeParse({
    orderId: formData.get("orderId"),
    courier: formData.get("courier"),
    trackingNumber: formData.get("trackingNumber"),
    trackingUrl: formData.get("trackingUrl") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter courier and tracking number." };
  }

  try {
    await fulfilOrder({
      orderId: parsed.data.orderId,
      userId: user.id,
      courier: parsed.data.courier,
      trackingNumber: parsed.data.trackingNumber,
      trackingUrl: parsed.data.trackingUrl,
      note: parsed.data.note,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to fulfil order.",
    };
  }

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function cancelOrderAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "") || undefined;

  if (!orderId) return { error: "Missing order." };

  try {
    await cancelOrderAdmin({ orderId, userId: user.id, reason });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to cancel order.",
    };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
  return { ok: true };
}

const deliveredSchema = z.object({
  orderId: z.string().min(1),
  deliveredAt: z.string().optional(),
  note: z.string().optional(),
});

export async function markDeliveredAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const parsed = deliveredSchema.safeParse({
    orderId: formData.get("orderId"),
    deliveredAt: formData.get("deliveredAt") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: "Missing order." };
  }

  let deliveredAt: Date | undefined;
  if (parsed.data.deliveredAt) {
    deliveredAt = new Date(parsed.data.deliveredAt);
    if (Number.isNaN(deliveredAt.getTime())) {
      return { error: "Invalid delivered date." };
    }
  }

  try {
    await markOrderDelivered({
      orderId: parsed.data.orderId,
      userId: user.id,
      deliveredAt,
      note: parsed.data.note,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to mark order delivered.",
    };
  }

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function completeOrderAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "") || undefined;

  if (!orderId) return { error: "Missing order." };

  const result = await completeOrder({
    orderId,
    userId: user.id,
    reason,
  });

  if (!result.ok) {
    return { error: result.reason };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

const reopenSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1),
});

export async function reopenOrderAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const parsed = reopenSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: "A reason is required to reopen an order." };
  }

  try {
    await reopenOrder({
      orderId: parsed.data.orderId,
      userId: user.id,
      reason: parsed.data.reason,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to reopen order.",
    };
  }

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

const trackingSchema = z.object({
  orderId: z.string().min(1),
  courier: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function updateTrackingAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const parsed = trackingSchema.safeParse({
    orderId: formData.get("orderId"),
    courier: formData.get("courier"),
    trackingNumber: formData.get("trackingNumber"),
    trackingUrl: formData.get("trackingUrl") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter courier and tracking number." };
  }

  try {
    await updateFulfilmentTracking({
      orderId: parsed.data.orderId,
      userId: user.id,
      courier: parsed.data.courier,
      trackingNumber: parsed.data.trackingNumber,
      trackingUrl: parsed.data.trackingUrl,
      note: parsed.data.note,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update tracking.",
    };
  }

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Tracking saved. No email was sent." };
}

export async function sendTrackingEmailAction(
  _prev: FulfilmentActionState,
  formData: FormData,
): Promise<FulfilmentActionState> {
  const user = await requireAdminSession("orders:fulfil");
  const orderId = String(formData.get("orderId") ?? "");
  const confirmResend = String(formData.get("confirmResend") ?? "");

  if (!orderId) return { error: "Missing order." };

  const { db } = await import("@/lib/db");
  const fulfilment = await db.fulfilment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  if (!fulfilment) {
    return { error: "No fulfilment record to notify about." };
  }

  const priorSends = await db.auditEvent.count({
    where: {
      entityType: "order",
      entityId: orderId,
      action: "order.tracking_email_sent",
    },
  });

  if (priorSends > 0 && confirmResend !== "yes") {
    return {
      error: "Confirm the re-send before notifying the customer again.",
    };
  }

  const result = await sendFulfilmentDispatchedEmail({
    fulfilmentId: fulfilment.id,
    actorId: user.id,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");

  if (result.status === "sent") {
    return {
      ok: true,
      message:
        priorSends > 0
          ? "Tracking email re-sent to the customer."
          : "Tracking email sent to the customer.",
    };
  }
  if (result.status === "not_configured") {
    return {
      warning:
        "Email is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL). Order state was not changed.",
    };
  }
  if (result.status === "refused") {
    return { error: result.reason };
  }
  return { error: result.message };
}
