import { NextResponse } from "next/server";
import { expireAbandonedReservations } from "@/lib/commerce/inventory-reservation";
import { cronHandlers } from "@/lib/cron/authorize";
import { RESERVATION_CRON_BATCH } from "@/lib/cron/config";

// Literal required by Next.js segment config. Keep in sync with vercel.json.
export const maxDuration = 60;

export const { GET, POST } = cronHandlers(async () => {
  const result = await expireAbandonedReservations(RESERVATION_CRON_BATCH);
  return NextResponse.json(result);
}, ["INTEGRATION_OUTBOX_CRON_SECRET", "ORDER_AUTO_COMPLETE_CRON_SECRET"]);
