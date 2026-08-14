import "server-only";

import {
  CommunicationPurpose,
  OutboxStatus,
  PreferenceStatus,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getResendClient } from "@/lib/email/resend";

function topicId() {
  return process.env.RESEND_NEWSLETTER_TOPIC_ID?.trim() || "";
}

function segmentId() {
  return process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim() || "";
}

export async function syncResendContact(customerId: string): Promise<string | null> {
  const client = getResendClient();
  if (!client) {
    await db.customer.update({
      where: { id: customerId },
      data: {
        resendSyncStatus: OutboxStatus.SYNCED,
        resendLastError: "Resend is not configured.",
        resendSyncedAt: new Date(),
      },
    });
    return "skipped:not_configured";
  }

  const customer = await db.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: {
      preferences: {
        where: { purpose: CommunicationPurpose.NEWSLETTER_EMAIL },
      },
    },
  });

  const newsletter = customer.preferences[0]?.status;
  const optedIn = newsletter === PreferenceStatus.OPTED_IN;
  const newsletterTopic = topicId();
  const newsletterSegment = segmentId();

  const contactPayload = {
    email: customer.email,
    firstName: customer.firstName || undefined,
    lastName: customer.lastName || undefined,
    unsubscribed: !optedIn,
    ...(newsletterTopic
      ? {
          topics: [
            {
              id: newsletterTopic,
              subscription: optedIn ? ("opt_in" as const) : ("opt_out" as const),
            },
          ],
        }
      : {}),
    ...(optedIn && newsletterSegment
      ? { segments: [{ id: newsletterSegment }] }
      : {}),
  };

  let contactId = customer.resendContactId;
  if (!contactId) {
    const existing = await client.contacts.get({ email: customer.email });
    if (existing.data?.id) {
      contactId = existing.data.id;
    } else {
      const created = await client.contacts.create(contactPayload);
      if (created.error) throw new Error(created.error.message);
      contactId = created.data?.id ?? null;
    }
  }

  if (contactId) {
    const updated = await client.contacts.update({
      id: contactId,
      unsubscribed: !optedIn,
      firstName: customer.firstName || undefined,
      lastName: customer.lastName || undefined,
    });
    if (updated.error && updated.error.name !== "not_found") {
      throw new Error(updated.error.message);
    }
    if (newsletterTopic) {
      const topics = await client.contacts.topics.update({
        id: contactId,
        topics: [
          {
            id: newsletterTopic,
            subscription: optedIn ? "opt_in" : "opt_out",
          },
        ],
      });
      if (topics.error) throw new Error(topics.error.message);
    }
    if (newsletterSegment) {
      if (optedIn) {
        await client.contacts.segments.add({
          contactId,
          segmentId: newsletterSegment,
        });
      } else {
        await client.contacts.segments.remove({
          contactId,
          segmentId: newsletterSegment,
        });
      }
    }
  }

  await db.customer.update({
    where: { id: customerId },
    data: {
      resendContactId: contactId,
      resendSyncStatus: OutboxStatus.SYNCED,
      resendSyncedAt: new Date(),
      resendLastError: null,
    },
  });

  return contactId;
}
