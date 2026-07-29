import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type AuditInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Prisma.InputJsonValue | null;
  afterState?: Prisma.InputJsonValue | null;
  requestId?: string | null;
  ipAddress?: string | null;
  sessionMetadata?: Prisma.InputJsonValue | null;
  reason?: string | null;
};

function redact(value: Prisma.InputJsonValue | null | undefined) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return value ?? null;
  }

  const clone = { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (
      /password|secret|token|card|cvv|authorization/i.test(key) &&
      clone[key] != null
    ) {
      clone[key] = "[redacted]";
    }
  }
  return clone as Prisma.InputJsonValue;
}

export async function recordAuditEvent(input: AuditInput) {
  return db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeState: redact(input.beforeState) ?? undefined,
      afterState: redact(input.afterState) ?? undefined,
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      sessionMetadata: input.sessionMetadata ?? undefined,
      reason: input.reason ?? null,
    },
  });
}
