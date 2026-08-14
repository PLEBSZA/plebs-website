"use server";

import { revalidatePath } from "next/cache";
import {
  CommunicationPurpose,
  ConsentAction,
  ConsentActorType,
  OutboxEventType,
} from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin/dal";
import { recordAuditEvent } from "@/lib/admin/audit";
import { withdrawNewsletter } from "@/lib/account/consent-service";
import { enqueueOutbox, processOutbox, scheduleOutboxProcessing } from "@/lib/account/outbox";
import { db } from "@/lib/db";

export async function adminSuppressCustomerAction(formData: FormData) {
  const user = await requireAdminSession("customers:manage");
  const customerId = String(formData.get("customerId") || "");
  const notes = String(formData.get("notes") || "").trim();
  await db.$transaction(async (tx) => {
    await withdrawNewsletter(tx, {
      customerId,
      source: "admin_suppression",
      wording: notes || "Suppressed by administrator. Opt-in was not granted.",
      wordingVersion: "admin-suppression-v1",
      actorType: ConsentActorType.ADMIN,
      actorId: user.id,
    });
  });
  await recordAuditEvent({
    actorId: user.id,
    action: "customer.suppressed",
    entityType: "customer",
    entityId: customerId,
    reason: notes || null,
  });
  scheduleOutboxProcessing();
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function adminRetrySyncAction(formData: FormData) {
  await requireAdminSession("customers:manage");
  const customerId = String(formData.get("customerId") || "");
  await db.$transaction((tx) =>
    enqueueOutbox(tx, {
      customerId,
      eventType: OutboxEventType.RESEND_CONTACT_SYNC,
      idempotencyKey: `resend-contact/${customerId}`,
      payload: { customerId },
      requeue: true,
    }),
  );
  await processOutbox(10);
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function adminResendSetupAction(formData: FormData) {
  const actor = await requireAdminSession("customers:manage");
  const userId = String(formData.get("userId") || "");
  const customerId = String(formData.get("customerId") || "");
  await db.$transaction((tx) =>
    enqueueOutbox(tx, {
      customerId,
      eventType: OutboxEventType.ACCOUNT_SETUP_EMAIL,
      idempotencyKey: `account-setup-email/${userId}`,
      payload: { userId },
      requeue: true,
    }),
  );
  await recordAuditEvent({
    actorId: actor.id,
    action: "customer.setup_resend",
    entityType: "customer",
    entityId: customerId,
  });
  scheduleOutboxProcessing();
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function adminDeactivateAccountAction(formData: FormData) {
  const actor = await requireAdminSession("customers:manage");
  const userId = String(formData.get("userId") || "");
  const customerId = String(formData.get("customerId") || "");
  await db.user.update({
    where: { id: userId },
    data: { active: false, sessionVersion: { increment: 1 } },
  });
  await recordAuditEvent({
    actorId: actor.id,
    action: "customer.deactivated",
    entityType: "customer",
    entityId: customerId,
  });
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function adminRecordHistoricConsentAction(formData: FormData) {
  const actor = await requireAdminSession("customers:manage");
  const customerId = String(formData.get("customerId") || "");
  const source = String(formData.get("source") || "").trim();
  const evidence = String(formData.get("evidence") || "").trim();
  const occurredAt = String(formData.get("occurredAt") || "").trim();
  if (!source || !evidence || !occurredAt) {
    throw new Error("Historic consent requires date, source and evidence notes.");
  }
  await db.consentEvent.create({
    data: {
      customerId,
      purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
      action: ConsentAction.GRANTED,
      source,
      wording: evidence,
      wordingVersion: "historic-imported-v1",
      privacyPolicyVersion: "imported-unverified",
      actorType: ConsentActorType.ADMIN,
      actorId: actor.id,
      createdAt: new Date(`${occurredAt}T12:00:00.000Z`),
    },
  });
  await recordAuditEvent({
    actorId: actor.id,
    action: "customer.historic_consent_recorded",
    entityType: "customer",
    entityId: customerId,
    afterState: { source, occurredAt },
    reason: evidence,
  });
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function adminProcessOutboxAction() {
  await requireAdminSession("customers:manage");
  await processOutbox(20);
}
