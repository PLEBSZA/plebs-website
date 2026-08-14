import "server-only";

import { processOutbox } from "@/lib/account/outbox";
import { expireAbandonedReservations } from "@/lib/commerce/inventory-reservation";
import { OUTBOX_CRON_BATCH, RESERVATION_CRON_BATCH } from "@/lib/cron/config";

export async function runIntegrationMaintenance(input?: {
  outboxLimit?: number;
  reservationLimit?: number;
}) {
  const outboxLimit = input?.outboxLimit ?? OUTBOX_CRON_BATCH;
  const reservationLimit = input?.reservationLimit ?? RESERVATION_CRON_BATCH;
  const [outbox, reservations] = await Promise.all([
    processOutbox(outboxLimit),
    expireAbandonedReservations(reservationLimit),
  ]);
  return { outbox, reservations };
}
