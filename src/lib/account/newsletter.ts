import "server-only";

import { z } from "zod";
import {
  CommunicationChannel,
  CommunicationPurpose,
} from "@/generated/prisma/client";
import { CONSENT_WORDING, GENERIC_ACCOUNT_RESPONSE } from "@/lib/account/consent";
import { startNewsletterDoubleOptIn } from "@/lib/account/consent-service";
import { parseNormalizedEmail } from "@/lib/account/email";
import { ensureCustomerAccount } from "@/lib/account/ensure-account";
import { scheduleOutboxProcessing } from "@/lib/account/outbox";
import { consumeThrottle } from "@/lib/account/throttle";
import { db } from "@/lib/db";

const newsletterSchema = z.object({
  email: z.string(),
  consent: z.literal(true),
});

export async function subscribeToNewsletter(input: {
  email: string;
  consent: boolean;
}) {
  const parsed = newsletterSchema.safeParse({
    email: input.email,
    consent: input.consent === true ? true : input.consent,
  });
  if (!parsed.success || input.consent !== true) {
    return {
      ok: false as const,
      message: "Tick the box to confirm PLEBS may email you news and updates.",
    };
  }

  const email = parseNormalizedEmail(parsed.data.email);
  if (!email) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  const allowed = await db.$transaction(async (tx) => {
    const throttle = await consumeThrottle(tx, `newsletter:${email}`);
    if (!throttle.allowed) return { throttled: true as const };

    const account = await ensureCustomerAccount(tx, {
      email,
      source: CONSENT_WORDING.NEWSLETTER_EMAIL.source,
    });

    const current = await tx.communicationPreference.findUnique({
      where: {
        customerId_purpose_channel: {
          customerId: account.customer.id,
          purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
          channel: CommunicationChannel.EMAIL,
        },
      },
    });

    await startNewsletterDoubleOptIn(tx, {
      customerId: account.customer.id,
      userId: account.user.id,
      explicitConsent: true,
      currentStatus: current?.status,
    });

    return { throttled: false as const };
  });

  if (allowed.throttled) {
    return { ok: true as const, message: GENERIC_ACCOUNT_RESPONSE };
  }

  scheduleOutboxProcessing();
  return { ok: true as const, message: GENERIC_ACCOUNT_RESPONSE };
}
