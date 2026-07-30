import "server-only";

import {
  PaymentStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getContactEmail, sendEmail } from "@/lib/email/resend";
import { emailTemplateAliases } from "@/lib/email/template-aliases";
import { formatMoney } from "@/lib/money";

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export async function sendOrderPaidEmails(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!order || order.paymentStatus !== PaymentStatus.PAID) return;

  const payment =
    order.payments.find((entry) => entry.status === PaymentStatus.PAID) ??
    order.payments[0];
  if (!payment) return;

  const item = order.items[0];
  const metadata = metadataRecord(payment.metadata);
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const itemName = item?.productName ?? "100% Cotton Corduroy Dungarees";
  const total = formatMoney(Number(order.total), order.currency);
  const contactEmail = getContactEmail();
  const line = {
    name: itemName,
    colour: item?.colour ?? "",
    size: item?.size ?? "",
    quantity: item?.quantity ?? 0,
    lineTotal: total,
  };

  if (!metadata.customerConfirmationSentAt) {
    const customerResult = await sendEmail({
      to: order.customerEmail,
      replyTo: contactEmail,
      subject: `Your PLEBS order ${order.number} is confirmed`,
      idempotencyKey: `order-paid-customer/${order.id}`,
      template: {
        id: emailTemplateAliases.orderConfirmed,
        variables: {
          CUSTOMER_FIRST_NAME: firstName,
          ORDER_NUMBER: order.number,
          TOTAL: total,
          PRODUCT_NAME: line.name,
          COLOUR: line.colour,
          SIZE: line.size,
          QUANTITY: String(line.quantity),
        },
      },
    });

    if (customerResult.sent) {
      metadata.customerConfirmationSentAt = new Date().toISOString();
      metadata.customerConfirmationEmailId = customerResult.id;
      await db.payment.update({
        where: { id: payment.id },
        data: { metadata: metadata as Prisma.InputJsonValue },
      });
    }
  }

  if (!metadata.ownerNotificationSentAt) {
    const ownerResult = await sendEmail({
      to: contactEmail,
      replyTo: order.customerEmail,
      subject: `Paid order ${order.number} · ${total}`,
      idempotencyKey: `order-paid-owner/${order.id}`,
      template: {
        id: emailTemplateAliases.orderOwner,
        variables: {
          ORDER_NUMBER: order.number,
          CUSTOMER_NAME: order.customerName,
          CUSTOMER_EMAIL: order.customerEmail,
          PRODUCT_NAME: itemName,
          COLOUR: line.colour,
          SIZE: line.size,
          QUANTITY: String(line.quantity),
          TOTAL: total,
        },
      },
    });

    if (ownerResult.sent) {
      metadata.ownerNotificationSentAt = new Date().toISOString();
      metadata.ownerNotificationEmailId = ownerResult.id;
      await db.payment.update({
        where: { id: payment.id },
        data: { metadata: metadata as Prisma.InputJsonValue },
      });
    }
  }
}
