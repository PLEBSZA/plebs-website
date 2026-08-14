import "server-only";

import {
  CommunicationPurpose,
  OutboxEventType,
  PreferenceStatus,
  type IntegrationOutbox,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendAccountSetupEmail } from "@/lib/account/account-emails";
import { sendNewsletterConfirmEmail } from "@/lib/account/account-emails";
import { sendNewsletterWelcome } from "@/lib/account/account-emails";
import { sendPasswordResetEmail } from "@/lib/account/account-emails";
import { syncResendContact } from "@/lib/account/resend-sync";

function payloadRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function processOutboxJob(
  job: IntegrationOutbox,
): Promise<string | null> {
  const payload = payloadRecord(job.payload);

  switch (job.eventType) {
    case OutboxEventType.RESEND_CONTACT_SYNC: {
      if (!job.customerId) return null;
      return syncResendContact(job.customerId);
    }
    case OutboxEventType.ACCOUNT_SETUP_EMAIL: {
      const userId = String(payload.userId ?? "");
      if (!userId) return null;
      await sendAccountSetupEmail(userId);
      return null;
    }
    case OutboxEventType.PASSWORD_RESET_EMAIL: {
      const userId = String(payload.userId ?? "");
      if (!userId) return null;
      await sendPasswordResetEmail(userId);
      return null;
    }
    case OutboxEventType.NEWSLETTER_CONFIRM_EMAIL: {
      const userId = String(payload.userId ?? "");
      if (!userId) return null;
      await sendNewsletterConfirmEmail(userId);
      return null;
    }
    case OutboxEventType.NEWSLETTER_WELCOME_EMAIL: {
      if (!job.customerId) return null;
      const customer = await db.customer.findUnique({
        where: { id: job.customerId },
        include: {
          preferences: {
            where: { purpose: CommunicationPurpose.NEWSLETTER_EMAIL },
          },
        },
      });
      const status = customer?.preferences[0]?.status;
      if (status !== PreferenceStatus.OPTED_IN || !customer) return null;
      await sendNewsletterWelcome(customer);
      return null;
    }
    default:
      return null;
  }
}
