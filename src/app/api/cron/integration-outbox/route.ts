import { NextResponse } from "next/server";
import { processOutbox } from "@/lib/account/outbox";
import { expireAbandonedReservations } from "@/lib/commerce/inventory-reservation";
import { cronHandlers } from "@/lib/cron/authorize";
import { OUTBOX_CRON_BATCH, RESERVATION_CRON_BATCH } from "@/lib/cron/config";

// Literal required by Next.js segment config. Keep in sync with vercel.json.
export const maxDuration = 300;

export const { GET, POST } = cronHandlers(async () => {
  const [outbox, reservations] = await Promise.all([
    processOutbox(OUTBOX_CRON_BATCH),
    expireAbandonedReservations(RESERVATION_CRON_BATCH),
  ]);
  return NextResponse.json({ outbox, reservations });
}, ["INTEGRATION_OUTBOX_CRON_SECRET"]);
