import "server-only";

import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/admin/audit";
import { getContactEmail, sendEmail } from "@/lib/email/resend";
import { emailTemplateAliases } from "@/lib/email/template-aliases";
import type { FulfilmentEmailResult } from "@/lib/email/fulfilment-emails";

export async function sendReturnReceivedEmail(input: {
  returnId: string;
  actorId?: string;
}): Promise<FulfilmentEmailResult> {
  const entry = await db.returnRequest.findUnique({
    where: { id: input.returnId },
    include: {
      order: true,
      orderItem: true,
    },
  });

  if (!entry) {
    return { status: "refused", reason: "Return not found." };
  }
  if (!entry.receivedAt) {
    return {
      status: "refused",
      reason: "Mark the return received before sending this email.",
    };
  }

  const priorSends = await db.auditEvent.count({
    where: {
      entityType: "return_request",
      entityId: entry.id,
      action: "return.received_email_sent",
    },
  });
  const sendSequence = priorSends + 1;
  const idempotencyKey = `return-received/${entry.id}/${sendSequence}`;

  const firstName =
    entry.order.customerName.trim().split(/\s+/)[0] || "there";
  const itemDescription = `${entry.orderItem.colour} / ${entry.orderItem.size} × ${entry.orderItem.quantity}`;

  try {
    const result = await sendEmail({
      to: entry.order.customerEmail,
      replyTo: getContactEmail(),
      subject: `We received your PLEBS return ${entry.reference}`,
      idempotencyKey,
      template: {
        id: emailTemplateAliases.returnReceived,
        variables: {
          CUSTOMER_FIRST_NAME: firstName,
          ORDER_NUMBER: entry.order.number,
          RETURN_REFERENCE: entry.reference,
          ITEM_DESCRIPTION: itemDescription,
        },
      },
    });

    if (!result.sent) {
      await recordAuditEvent({
        actorId: input.actorId,
        action: "return.received_email_sent_failed",
        entityType: "return_request",
        entityId: entry.id,
        afterState: { reason: result.reason, sendSequence },
      });
      return { status: "not_configured" };
    }

    await recordAuditEvent({
      actorId: input.actorId,
      action: "return.received_email_sent",
      entityType: "return_request",
      entityId: entry.id,
      afterState: {
        sendSequence,
        reference: entry.reference,
        emailId: result.id,
      },
    });

    return { status: "sent", emailId: result.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    await recordAuditEvent({
      actorId: input.actorId,
      action: "return.received_email_sent_failed",
      entityType: "return_request",
      entityId: entry.id,
      afterState: { message, sendSequence },
    });
    return { status: "failed", message };
  }
}
