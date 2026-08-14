import "server-only";

import { NextResponse } from "next/server";
import {
  authorizeCronSecrets,
  bearerFromAuthorization,
} from "@/lib/cron/secrets";

/**
 * Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` on GET.
 * Named secrets remain valid for manual POST/GET from ops scripts.
 * CRON_SECRET authenticates maintenance only; it does not replace Auth.js,
 * Paystack verification, or checkout tokens.
 */
export function authorizeCronRequest(
  request: Request,
  envKeys: readonly string[],
): NextResponse | null {
  const result = authorizeCronSecrets({
    env: process.env,
    envKeys,
    bearer: bearerFromAuthorization(request.headers.get("authorization")),
    headerSecret: request.headers.get("x-cron-secret"),
  });
  if (result === "ok") return null;
  if (result === "unconfigured") {
    return NextResponse.json(
      { message: "Cron secret is not configured." },
      { status: 503 },
    );
  }
  return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
}

export function cronHandlers(
  run: (request: Request) => Promise<NextResponse>,
  envKeys: readonly string[] = [],
) {
  const handler = async (request: Request) => {
    const denied = authorizeCronRequest(request, envKeys);
    if (denied) return denied;
    return run(request);
  };
  return { GET: handler, POST: handler };
}
