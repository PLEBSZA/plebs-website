import "server-only";

import {
  getContactEmail,
  isResendConfigured,
} from "@/lib/email/resend";
import { db } from "@/lib/db";

const ORDER_EMAIL_ACTIONS = [
  "order.tracking_email_sent",
  "order.tracking_email_sent_failed",
  "order.delivery_email_sent",
  "order.delivery_email_sent_failed",
] as const;

const RETURN_EMAIL_ACTIONS = [
  "return.received_email_sent",
  "return.received_email_sent_failed",
] as const;

export function getAdminEmailStatus() {
  const configured = isResendConfigured();
  return {
    configured,
    fromAddress: configured
      ? process.env.RESEND_FROM_EMAIL?.trim() ?? null
      : null,
    replyTo: getContactEmail(),
  };
}

export async function listOrderEmailHistory(orderId: string) {
  return db.auditEvent.findMany({
    where: {
      entityType: "order",
      entityId: orderId,
      action: { in: [...ORDER_EMAIL_ACTIONS] },
    },
    include: {
      actor: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listReturnEmailHistory(returnId: string) {
  return db.auditEvent.findMany({
    where: {
      entityType: "return_request",
      entityId: returnId,
      action: { in: [...RETURN_EMAIL_ACTIONS] },
    },
    include: {
      actor: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export function describeEmailAuditAction(action: string) {
  switch (action) {
    case "order.tracking_email_sent":
      return "Tracking email sent";
    case "order.tracking_email_sent_failed":
      return "Tracking email failed";
    case "order.delivery_email_sent":
      return "Delivery email sent";
    case "order.delivery_email_sent_failed":
      return "Delivery email failed";
    case "return.received_email_sent":
      return "Return-received email sent";
    case "return.received_email_sent_failed":
      return "Return-received email failed";
    default:
      return action;
  }
}

export function readEmailOutcome(afterState: unknown) {
  if (!afterState || typeof afterState !== "object" || Array.isArray(afterState)) {
    return null;
  }
  const state = afterState as Record<string, unknown>;
  if (typeof state.message === "string") return state.message;
  if (typeof state.reason === "string") return state.reason;
  if (typeof state.emailId === "string") return `id ${state.emailId}`;
  return null;
}
