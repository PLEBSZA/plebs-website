import { NextResponse } from "next/server";
import { expireAbandonedReservations } from "@/lib/commerce/inventory-reservation";
import { cronHandlers } from "@/lib/cron/authorize";
import {
  CRON_MAX_DURATION_SECONDS,
  RESERVATION_CRON_BATCH,
} from "@/lib/cron/config";

export const maxDuration = CRON_MAX_DURATION_SECONDS;

export const { GET, POST } = cronHandlers(async () => {
  const result = await expireAbandonedReservations(RESERVATION_CRON_BATCH);
  return NextResponse.json(result);
}, ["INTEGRATION_OUTBOX_CRON_SECRET", "ORDER_AUTO_COMPLETE_CRON_SECRET"]);
