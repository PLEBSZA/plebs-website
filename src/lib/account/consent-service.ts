import "server-only";

import {
  CommunicationChannel,
  CommunicationPurpose,
  ConsentAction,
  ConsentActorType,
  OutboxEventType,
  PreferenceStatus,
  type Prisma,
} from "@/generated/prisma/client";
import {
  CONSENT_WORDING,
  PRIVACY_POLICY_VERSION,
} from "@/lib/account/consent";
import { enqueueOutbox } from "@/lib/account/outbox";
import { shouldRecordNewsletterGrant } from "@/lib/account/policy";

type ConsentTx = Prisma.TransactionClient;

export async function recordConsentEvent(
  tx: ConsentTx,
  input: {
    customerId: string;
    purpose: CommunicationPurpose;
    action: ConsentAction;
    source: string;
    wording: string;
    wordingVersion: string;
    actorType?: ConsentActorType;
    actorId?: string | null;
    providerEventId?: string | null;
    occurredAt?: Date;
  },
) {
  if (input.providerEventId) {
    const existing = await tx.consentEvent.findUnique({
      where: { providerEventId: input.providerEventId },
    });
    if (existing) return existing;
  }

  return tx.consentEvent.create({
    data: {
      customerId: input.customerId,
      purpose: input.purpose,
      channel: CommunicationChannel.EMAIL,
      action: input.action,
      source: input.source,
      wording: input.wording,
      wordingVersion: input.wordingVersion,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      actorType: input.actorType ?? ConsentActorType.CUSTOMER,
      actorId: input.actorId ?? null,
      providerEventId: input.providerEventId ?? null,
      ...(input.occurredAt ? { createdAt: input.occurredAt } : {}),
    },
  });
}

export async function setPreference(
  tx: ConsentTx,
  input: {
    customerId: string;
    purpose: CommunicationPurpose;
    status: PreferenceStatus;
    source: string;
    wordingVersion?: string;
  },
) {
  return tx.communicationPreference.upsert({
    where: {
      customerId_purpose_channel: {
        customerId: input.customerId,
        purpose: input.purpose,
        channel: CommunicationChannel.EMAIL,
      },
    },
    create: {
      customerId: input.customerId,
      purpose: input.purpose,
      channel: CommunicationChannel.EMAIL,
      status: input.status,
      source: input.source,
      wordingVersion: input.wordingVersion,
    },
    update: {
      status: input.status,
      source: input.source,
      wordingVersion: input.wordingVersion,
    },
  });
}

export async function startNewsletterDoubleOptIn(
  tx: ConsentTx,
  input: {
    customerId: string;
    userId: string;
    explicitConsent: boolean;
    currentStatus?: string | null;
  },
) {
  if (
    !shouldRecordNewsletterGrant({
      explicitConsent: input.explicitConsent,
      currentStatus: input.currentStatus,
    })
  ) {
    return { changed: false as const };
  }

  const copy = CONSENT_WORDING.NEWSLETTER_EMAIL;
  await setPreference(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
    status: PreferenceStatus.PENDING_CONFIRMATION,
    source: copy.source,
    wordingVersion: copy.version,
  });
  await recordConsentEvent(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
    action: ConsentAction.PENDING_CONFIRMATION,
    source: copy.source,
    wording: copy.text,
    wordingVersion: copy.version,
  });
  await enqueueOutbox(tx, {
    customerId: input.customerId,
    eventType: OutboxEventType.NEWSLETTER_CONFIRM_EMAIL,
    idempotencyKey: `newsletter-confirm-email/${input.userId}`,
    payload: { userId: input.userId },
    requeue: true,
  });
  await enqueueOutbox(tx, {
    customerId: input.customerId,
    eventType: OutboxEventType.RESEND_CONTACT_SYNC,
    idempotencyKey: `resend-contact/${input.customerId}`,
    payload: { customerId: input.customerId },
    requeue: true,
  });
  return { changed: true as const };
}

export async function activateNewsletter(
  tx: ConsentTx,
  input: {
    customerId: string;
    source: string;
    wording: string;
    wordingVersion: string;
    actorType?: ConsentActorType;
    actorId?: string | null;
  },
) {
  await setPreference(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
    status: PreferenceStatus.OPTED_IN,
    source: input.source,
    wordingVersion: input.wordingVersion,
  });
  await recordConsentEvent(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
    action: ConsentAction.GRANTED,
    source: input.source,
    wording: input.wording,
    wordingVersion: input.wordingVersion,
    actorType: input.actorType,
    actorId: input.actorId,
  });
  await enqueueOutbox(tx, {
    customerId: input.customerId,
    eventType: OutboxEventType.RESEND_CONTACT_SYNC,
    idempotencyKey: `resend-contact/${input.customerId}`,
    payload: { customerId: input.customerId },
    requeue: true,
  });
  await enqueueOutbox(tx, {
    customerId: input.customerId,
    eventType: OutboxEventType.NEWSLETTER_WELCOME_EMAIL,
    idempotencyKey: `newsletter-welcome/${input.customerId}`,
    payload: { customerId: input.customerId },
  });
}

export async function withdrawNewsletter(
  tx: ConsentTx,
  input: {
    customerId: string;
    source: string;
    wording: string;
    wordingVersion: string;
    actorType?: ConsentActorType;
    actorId?: string | null;
    providerEventId?: string | null;
  },
) {
  await setPreference(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
    status:
      input.actorType === ConsentActorType.ADMIN ||
      input.actorType === ConsentActorType.PROVIDER
        ? PreferenceStatus.SUPPRESSED
        : PreferenceStatus.OPTED_OUT,
    source: input.source,
    wordingVersion: input.wordingVersion,
  });
  await recordConsentEvent(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
    action:
      input.actorType === ConsentActorType.ADMIN ||
      input.actorType === ConsentActorType.PROVIDER
        ? ConsentAction.SUPPRESSED
        : ConsentAction.WITHDRAWN,
    source: input.source,
    wording: input.wording,
    wordingVersion: input.wordingVersion,
    actorType: input.actorType,
    actorId: input.actorId,
    providerEventId: input.providerEventId,
  });
  await enqueueOutbox(tx, {
    customerId: input.customerId,
    eventType: OutboxEventType.RESEND_CONTACT_SYNC,
    idempotencyKey: `resend-contact/${input.customerId}`,
    payload: { customerId: input.customerId },
    requeue: true,
  });
}

export async function recordRestockAlertConsent(
  tx: ConsentTx,
  input: { customerId: string },
) {
  const copy = CONSENT_WORDING.RESTOCK_ALERT_EMAIL;
  await setPreference(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.RESTOCK_ALERT_EMAIL,
    status: PreferenceStatus.OPTED_IN,
    source: copy.source,
    wordingVersion: copy.version,
  });
  await recordConsentEvent(tx, {
    customerId: input.customerId,
    purpose: CommunicationPurpose.RESTOCK_ALERT_EMAIL,
    action: ConsentAction.GRANTED,
    source: copy.source,
    wording: copy.text,
    wordingVersion: copy.version,
  });
}
