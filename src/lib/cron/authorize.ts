import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function secretsMatch(expected: string, provided: string | null) {
  if (!provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function providedCronSecrets(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  return [bearer, request.headers.get("x-cron-secret")];
}

/**
 * Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` on GET.
 * Named secrets remain valid for manual POST/GET from ops scripts.
 */
export function authorizeCronRequest(
  request: Request,
  envKeys: readonly string[],
): NextResponse | null {
  const keys = ["CRON_SECRET", ...envKeys];
  const expected = [
    ...new Set(
      keys
        .map((key) => process.env[key]?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  if (expected.length === 0) {
    return NextResponse.json(
      { message: "Cron secret is not configured." },
      { status: 503 },
    );
  }

  const provided = providedCronSecrets(request);
  if (
    expected.some((secret) =>
      provided.some((value) => secretsMatch(secret, value)),
    )
  ) {
    return null;
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
