import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { autoCompleteDeliveredOrders } from "@/lib/commerce/fulfilment-service";

function secretsMatch(expected: string, provided: string | null) {
  if (!provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Cron/manual trigger for auto-completing delivered orders.
 * Defaults to dry-run. Pass ?live=1 to write.
 * Auth: Authorization: Bearer <ORDER_AUTO_COMPLETE_CRON_SECRET>
 *    or x-cron-secret: <ORDER_AUTO_COMPLETE_CRON_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.ORDER_AUTO_COMPLETE_CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { message: "Cron secret is not configured." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  const headerSecret = request.headers.get("x-cron-secret");
  if (!secretsMatch(secret, bearer) && !secretsMatch(secret, headerSecret)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const live = url.searchParams.get("live") === "1";

  const result = await autoCompleteDeliveredOrders({
    dryRun: !live,
    actorId: null,
  });

  return NextResponse.json(result, {
    status: result.configured ? 200 : 200,
  });
}
