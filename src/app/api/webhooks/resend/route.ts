import { NextResponse } from "next/server";
import {
  CommunicationPurpose,
  ConsentActorType,
  PreferenceStatus,
} from "@/generated/prisma/client";
import { withdrawNewsletter } from "@/lib/account/consent-service";
import { db } from "@/lib/db";
import { getResendClient } from "@/lib/email/resend";
import { scheduleOutboxProcessing } from "@/lib/account/outbox";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const client = getResendClient();
  if (!secret || !client) {
    return NextResponse.json({ message: "Webhook is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const headers = {
    id: request.headers.get("svix-id") ?? request.headers.get("webhook-id") ?? "",
    timestamp:
      request.headers.get("svix-timestamp") ??
      request.headers.get("webhook-timestamp") ??
      "",
    signature:
      request.headers.get("svix-signature") ??
      request.headers.get("webhook-signature") ??
      "",
  };

  let event;
  try {
    event = client.webhooks.verify({ payload, headers, webhookSecret: secret });
  } catch {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  if (event.type !== "contact.updated" && event.type !== "contact.deleted") {
    return NextResponse.json({ received: true });
  }

  const email = event.data.email?.trim().toLowerCase();
  const providerEventId = `${event.type}:${event.data.id}:${event.created_at}`;
  if (!email) return NextResponse.json({ received: true });

  const customer = await db.customer.findFirst({
    where: {
      OR: [{ email }, { resendContactId: event.data.id }],
    },
    include: {
      preferences: {
        where: { purpose: CommunicationPurpose.NEWSLETTER_EMAIL },
      },
    },
  });
  if (!customer) return NextResponse.json({ received: true });

  const unsubscribed = event.type === "contact.deleted" || event.data.unsubscribed;
  if (!unsubscribed) {
    return NextResponse.json({ received: true, ignored: "no_opt_in_from_provider" });
  }

  const current = customer.preferences[0]?.status;
  if (
    current === PreferenceStatus.OPTED_OUT ||
    current === PreferenceStatus.SUPPRESSED
  ) {
    return NextResponse.json({ received: true });
  }

  await db.$transaction((tx) =>
    withdrawNewsletter(tx, {
      customerId: customer.id,
      source: "resend_webhook",
      wording: "Unsubscribed via Resend contact update.",
      wordingVersion: "resend-contact-updated-v1",
      actorType: ConsentActorType.PROVIDER,
      providerEventId,
    }),
  );
  scheduleOutboxProcessing();

  return NextResponse.json({ received: true });
}
