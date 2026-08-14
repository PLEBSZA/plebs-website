import { NextResponse } from "next/server";
import { autoCompleteDeliveredOrders } from "@/lib/commerce/fulfilment-service";
import { cronHandlers } from "@/lib/cron/authorize";
import { CRON_MAX_DURATION_SECONDS } from "@/lib/cron/config";

export const maxDuration = CRON_MAX_DURATION_SECONDS;

/**
 * Cron/manual trigger for auto-completing delivered orders.
 * Defaults to dry-run. Pass ?live=1 to write.
 * Auth: Authorization: Bearer <CRON_SECRET or ORDER_AUTO_COMPLETE_CRON_SECRET>
 *    or x-cron-secret: <same>
 */
export const { GET, POST } = cronHandlers(async (request) => {
  const url = new URL(request.url);
  const live = url.searchParams.get("live") === "1";

  const result = await autoCompleteDeliveredOrders({
    dryRun: !live,
    actorId: null,
  });

  return NextResponse.json(result);
}, ["ORDER_AUTO_COMPLETE_CRON_SECRET"]);
