import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  AUTH_THROTTLE_MAX_ATTEMPTS,
  AUTH_THROTTLE_WINDOW_MS,
} from "@/lib/account/consent";
import { createHash } from "node:crypto";

export async function consumeThrottle(
  tx: Prisma.TransactionClient,
  rawKey: string,
  now = new Date(),
): Promise<{ allowed: boolean }> {
  const throttleKey = createHash("sha256").update(rawKey).digest("hex");
  const windowStartFloor = new Date(now.getTime() - AUTH_THROTTLE_WINDOW_MS);

  const row = await tx.authThrottle.upsert({
    where: { throttleKey },
    create: {
      throttleKey,
      windowStart: now,
      attemptCount: 1,
    },
    update: {},
  });

  if (row.windowStart < windowStartFloor) {
    await tx.authThrottle.update({
      where: { throttleKey },
      data: { windowStart: now, attemptCount: 1 },
    });
    return { allowed: true };
  }

  if (row.attemptCount >= AUTH_THROTTLE_MAX_ATTEMPTS) {
    return { allowed: false };
  }

  await tx.authThrottle.update({
    where: { throttleKey },
    data: { attemptCount: { increment: 1 } },
  });
  return { allowed: true };
}
