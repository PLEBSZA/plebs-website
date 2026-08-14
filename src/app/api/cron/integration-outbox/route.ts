import { NextResponse } from "next/server";
import { processOutbox } from "@/lib/account/outbox";
import { expireAbandonedReservations } from "@/lib/commerce/inventory-reservation";
import { cronHandlers } from "@/lib/cron/authorize";
import {
  CRON_MAX_DURATION_SECONDS,
  OUTBOX_CRON_BATCH,
  RESERVATION_CRON_BATCH,
} from "@/lib/cron/config";

export const maxDuration = CRON_MAX_DURATION_SECONDS;

export const { GET, POST } = cronHandlers(async () => {
  const [outbox, reservations] = await Promise.all([
    processOutbox(OUTBOX_CRON_BATCH),
    expireAbandonedReservations(RESERVATION_CRON_BATCH),
  ]);
  return NextResponse.json({ outbox, reservations });
}, ["INTEGRATION_OUTBOX_CRON_SECRET"]);
