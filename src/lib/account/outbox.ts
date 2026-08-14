import "server-only";

import {
  OutboxEventType,
  OutboxStatus,
  type Prisma,
} from "@/generated/prisma/client";
import {
  OUTBOX_STALE_PROCESSING_MS,
  TOKEN_RESEND_COOLDOWN_MS,
} from "@/lib/account/consent";
import { AccountEmailRetryableError } from "@/lib/account/account-emails";
import { shouldProcessClaimedOutboxJob } from "@/lib/account/outbox-policy";
import { db } from "@/lib/db";

export type OutboxTx = Prisma.TransactionClient;

export async function enqueueOutbox(
  tx: OutboxTx,
  input: {
    customerId?: string | null;
    eventType: OutboxEventType;
    idempotencyKey: string;
    payload: Prisma.InputJsonValue;
    requeue?: boolean;
  },
) {
  return tx.integrationOutbox.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      customerId: input.customerId ?? null,
      eventType: input.eventType,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
      status: OutboxStatus.PENDING,
      nextAttemptAt: new Date(),
    },
    update: input.requeue
      ? {
          status: OutboxStatus.PENDING,
          nextAttemptAt: new Date(),
          lastError: null,
          payload: input.payload,
          customerId: input.customerId ?? undefined,
        }
      : {},
  });
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown error";
  return message
    .replace(/re_[A-Za-z0-9_]+/gi, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 400);
}

export async function recoverStaleOutboxJobs(
  staleAfterMs = OUTBOX_STALE_PROCESSING_MS,
) {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const recovered = await db.integrationOutbox.updateMany({
    where: {
      status: OutboxStatus.PROCESSING,
      updatedAt: { lt: cutoff },
    },
    data: {
      status: OutboxStatus.PENDING,
      nextAttemptAt: new Date(),
      lastError: "Recovered after stale PROCESSING state.",
    },
  });
  return recovered.count;
}

export async function processOutbox(limit = 15) {
  const staleRecovered = await recoverStaleOutboxJobs();
  const due = await db.integrationOutbox.findMany({
    where: {
      status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const results = {
    processed: 0,
    synced: 0,
    failed: 0,
    staleRecovered,
  };

  for (const job of due) {
    const claimed = await db.integrationOutbox.updateMany({
      where: {
        id: job.id,
        status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
      },
      data: { status: OutboxStatus.PROCESSING, attempts: { increment: 1 } },
    });
    if (!shouldProcessClaimedOutboxJob(claimed.count)) continue;
    results.processed += 1;

    try {
      const { processOutboxJob } = await import("@/lib/account/outbox-handlers");
      const providerRecordId = await processOutboxJob(job);
      await db.integrationOutbox.update({
        where: { id: job.id },
        data: {
          status: OutboxStatus.SYNCED,
          syncedAt: new Date(),
          lastError: null,
          providerRecordId: providerRecordId ?? job.providerRecordId,
        },
      });
      results.synced += 1;
    } catch (error) {
      const attempts = job.attempts + 1;
      const cooldownDelay =
        error instanceof AccountEmailRetryableError &&
        /cooldown/i.test(error.message)
          ? TOKEN_RESEND_COOLDOWN_MS
          : null;
      const delayMs =
        cooldownDelay ??
        Math.min(30 * 60 * 1000, 30_000 * 2 ** Math.min(attempts, 6));
      await db.integrationOutbox.update({
        where: { id: job.id },
        data: {
          status: OutboxStatus.FAILED,
          lastError: sanitizeError(error),
          nextAttemptAt: new Date(Date.now() + delayMs),
        },
      });
      results.failed += 1;
    }
  }

  return results;
}

export async function scheduleOutboxProcessing() {
  const { after } = await import("next/server");
  after(async () => {
    try {
      await processOutbox(15);
    } catch (error) {
      console.error(
        "Outbox processing failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  });
}
