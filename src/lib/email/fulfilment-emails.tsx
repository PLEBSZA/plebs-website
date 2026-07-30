import "server-only";

import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/admin/audit";
import { getContactEmail, sendEmail } from "@/lib/email/resend";
import { emailTemplateAliases } from "@/lib/email/template-aliases";

export type FulfilmentEmailResult =
  | { status: "sent"; emailId: string | null }
  | { status: "not_configured" }
  | { status: "refused"; reason: string }
  | { status: "failed"; message: string };

/**
 * Operator-triggered shipping confirmation.
 * Idempotency key includes fulfilment id + tracking number + a sequence derived
 * from prior successful send audits, so:
 * - a genuine double-submit of the same attempt (same tracking + same sequence)
 *   is de-duplicated by Resend for 24h;
 * - a re-send after a tracking correction uses a different key and delivers.
 */
export async function sendFulfilmentDispatchedEmail(input: {
  fulfilmentId: string;
  actorId?: string;
}): Promise<FulfilmentEmailResult> {
  const fulfilment = await db.fulfilment.findUnique({
    where: { id: input.fulfilmentId },
    include: { order: true },
  });

  if (!fulfilment) {
    return { status: "refused", reason: "Fulfilment not found." };
  }
  if (!fulfilment.courier || !fulfilment.trackingNumber) {
    return {
      status: "refused",
      reason: "Courier and tracking number are required before notifying.",
    };
  }

  const priorSends = await db.auditEvent.count({
    where: {
      entityType: "order",
      entityId: fulfilment.orderId,
      action: "order.tracking_email_sent",
    },
  });
  const sendSequence = priorSends + 1;
  // Include tracking so a corrected waybill cannot collide with a prior key
  // within Resend's 24h retention window for the same sequence.
  const idempotencyKey = `fulfilment-dispatched/${fulfilment.id}/${sendSequence}/${fulfilment.trackingNumber}`;

  const firstName =
    fulfilment.order.customerName.trim().split(/\s+/)[0] || "there";

  try {
    const result = await sendEmail({
      to: fulfilment.order.customerEmail,
      replyTo: getContactEmail(),
      subject: `Your PLEBS order ${fulfilment.order.number} is on its way`,
      idempotencyKey,
      template: {
        id: emailTemplateAliases.shippingConfirmation,
        variables: {
          CUSTOMER_FIRST_NAME: firstName,
          ORDER_NUMBER: fulfilment.order.number,
          COURIER: fulfilment.courier,
          TRACKING_NUMBER: fulfilment.trackingNumber,
          TRACKING_URL:
            fulfilment.trackingUrl ?? "https://www.plebs.co.za/contact/",
          TRACKING_CTA: fulfilment.trackingUrl
            ? "Track your order"
            : "Get tracking help",
        },
      },
    });

    if (!result.sent) {
      await recordAuditEvent({
        actorId: input.actorId,
        action: "order.tracking_email_sent_failed",
        entityType: "order",
        entityId: fulfilment.orderId,
        afterState: {
          reason: result.reason,
          fulfilmentId: fulfilment.id,
          sendSequence,
        },
      });
      return { status: "not_configured" };
    }

    await db.fulfilment.update({
      where: { id: fulfilment.id },
      data: { customerNotifiedAt: new Date() },
    });

    await recordAuditEvent({
      actorId: input.actorId,
      action: "order.tracking_email_sent",
      entityType: "order",
      entityId: fulfilment.orderId,
      afterState: {
        fulfilmentId: fulfilment.id,
        sendSequence,
        courier: fulfilment.courier,
        trackingNumber: fulfilment.trackingNumber,
        emailId: result.id,
      },
    });

    return { status: "sent", emailId: result.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    await recordAuditEvent({
      actorId: input.actorId,
      action: "order.tracking_email_sent_failed",
      entityType: "order",
      entityId: fulfilment.orderId,
      afterState: {
        message,
        fulfilmentId: fulfilment.id,
        sendSequence,
      },
    });
    return { status: "failed", message };
  }
}

export async function sendDeliveryConfirmationEmail(input: {
  orderId: string;
  actorId?: string;
}): Promise<FulfilmentEmailResult> {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: {
      fulfilments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) {
    return { status: "refused", reason: "Order not found." };
  }

  const fulfilment = order.fulfilments[0];
  if (!fulfilment?.deliveredAt) {
    return {
      status: "refused",
      reason: "Mark the order delivered before sending a delivery email.",
    };
  }

  const priorSends = await db.auditEvent.count({
    where: {
      entityType: "order",
      entityId: order.id,
      action: "order.delivery_email_sent",
    },
  });
  const sendSequence = priorSends + 1;
  const deliveredOn = new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
  }).format(fulfilment.deliveredAt);
  const idempotencyKey = `order-delivered/${order.id}/${sendSequence}/${fulfilment.deliveredAt.toISOString()}`;

  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";

  try {
    const result = await sendEmail({
      to: order.customerEmail,
      replyTo: getContactEmail(),
      subject: `Your PLEBS order ${order.number} has arrived`,
      idempotencyKey,
      template: {
        id: emailTemplateAliases.deliveryConfirmation,
        variables: {
          CUSTOMER_FIRST_NAME: firstName,
          ORDER_NUMBER: order.number,
          DELIVERED_ON: deliveredOn,
          SUPPORT_URL: "https://www.plebs.co.za/contact/",
          RETURNS_URL: "https://www.plebs.co.za/shipping-returns/",
        },
      },
    });

    if (!result.sent) {
      await recordAuditEvent({
        actorId: input.actorId,
        action: "order.delivery_email_sent_failed",
        entityType: "order",
        entityId: order.id,
        afterState: { reason: result.reason, sendSequence },
      });
      return { status: "not_configured" };
    }

    await recordAuditEvent({
      actorId: input.actorId,
      action: "order.delivery_email_sent",
      entityType: "order",
      entityId: order.id,
      afterState: {
        sendSequence,
        deliveredOn,
        emailId: result.id,
      },
    });

    return { status: "sent", emailId: result.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    await recordAuditEvent({
      actorId: input.actorId,
      action: "order.delivery_email_sent_failed",
      entityType: "order",
      entityId: order.id,
      afterState: { message, sendSequence },
    });
    return { status: "failed", message };
  }
}
