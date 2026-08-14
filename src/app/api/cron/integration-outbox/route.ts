import { NextResponse } from "next/server";
import { cronHandlers } from "@/lib/cron/authorize";
import { runIntegrationMaintenance } from "@/lib/cron/run-maintenance";

// Literal required by Next.js segment config. Keep in sync with vercel.json
// and CRON_MAX_DURATION_SECONDS.
export const maxDuration = 60;

export const { GET, POST } = cronHandlers(async () => {
  const result = await runIntegrationMaintenance();
  return NextResponse.json(result);
}, ["INTEGRATION_OUTBOX_CRON_SECRET"]);
