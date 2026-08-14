import "server-only";

import { RestockRequestStatus } from "@/generated/prisma/client";
import { CONSENT_WORDING } from "@/lib/account/consent";
import { recordRestockAlertConsent } from "@/lib/account/consent-service";
import { parseNormalizedEmail } from "@/lib/account/email";
import { ensureCustomerAccount } from "@/lib/account/ensure-account";
import { scheduleOutboxProcessing } from "@/lib/account/outbox";
import { db } from "@/lib/db";
import { findStorefrontVariant } from "@/lib/commerce/storefront-product";

export async function createRestockRequest(input: {
  email: string;
  size: string;
  colour?: string;
  alertConsent?: boolean;
  marketingConsent?: boolean;
}) {
  const email = parseNormalizedEmail(input.email);
  const size = input.size.trim().toUpperCase();
  const colour = input.colour?.trim() || "Forest Green";
  const alertConsent = Boolean(input.alertConsent ?? input.marketingConsent);

  if (!email) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  if (!alertConsent) {
    return {
      ok: false as const,
      message: "Please confirm we may email you about this restock.",
    };
  }

  if (!size) {
    return { ok: false as const, message: "Select a size to be notified about." };
  }

  const variant = await findStorefrontVariant({ colour, size });
  if (!variant) {
    return {
      ok: false as const,
      message: "Select a valid colour and size combination.",
    };
  }

  const dbVariant = await db.productVariant.findUnique({
    where: { id: variant.id },
    select: { id: true, productId: true },
  });

  if (!dbVariant) {
    return {
      ok: false as const,
      message: "Restock requests are unavailable until the catalogue is online.",
    };
  }

  const existing = await db.restockRequest.findFirst({
    where: {
      email,
      variantId: dbVariant.id,
      status: RestockRequestStatus.ACTIVE,
    },
  });

  if (existing) {
    await db.$transaction((tx) =>
      ensureCustomerAccount(tx, {
        email,
        source: CONSENT_WORDING.RESTOCK_ALERT_EMAIL.source,
      }),
    );
    scheduleOutboxProcessing();
    return {
      ok: true as const,
      request: {
        id: existing.id,
        email: existing.email,
        size: existing.size,
        colour: existing.colour,
        createdAt: existing.createdAt.toISOString(),
      },
    };
  }

  const created = await db.$transaction(async (tx) => {
    const account = await ensureCustomerAccount(tx, {
      email,
      source: CONSENT_WORDING.RESTOCK_ALERT_EMAIL.source,
    });
    await recordRestockAlertConsent(tx, { customerId: account.customer.id });

    const request = await tx.restockRequest.create({
      data: {
        email,
        customerId: account.customer.id,
        productId: dbVariant.productId,
        variantId: dbVariant.id,
        colour: variant.colourName,
        size: variant.sizeName,
        status: RestockRequestStatus.ACTIVE,
        alertConsent: true,
        source: "storefront",
      },
    });

    return request;
  });

  scheduleOutboxProcessing();

  return {
    ok: true as const,
    request: {
      id: created.id,
      email: created.email,
      size: created.size,
      colour: created.colour,
      createdAt: created.createdAt.toISOString(),
    },
  };
}

export async function listRestockRequests() {
  return db.restockRequest.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function getRestockDemandSummary() {
  const requests = await db.restockRequest.findMany({
    where: { status: RestockRequestStatus.ACTIVE },
    orderBy: { createdAt: "asc" },
  });

  const bySize = new Map<
    string,
    {
      size: string;
      colour: string;
      activeRequests: number;
      uniqueCustomers: Set<string>;
      oldestRequest: Date;
    }
  >();

  for (const request of requests) {
    const key = `${request.colour}::${request.size}`;
    const existing = bySize.get(key);
    if (existing) {
      existing.activeRequests += 1;
      existing.uniqueCustomers.add(request.email);
      if (request.createdAt < existing.oldestRequest) {
        existing.oldestRequest = request.createdAt;
      }
      continue;
    }
    bySize.set(key, {
      size: request.size,
      colour: request.colour,
      activeRequests: 1,
      uniqueCustomers: new Set([request.email]),
      oldestRequest: request.createdAt,
    });
  }

  return [...bySize.values()]
    .map((entry) => ({
      size: entry.size,
      colour: entry.colour,
      activeRequests: entry.activeRequests,
      uniqueCustomers: entry.uniqueCustomers.size,
      oldestRequest: entry.oldestRequest,
    }))
    .sort((a, b) => b.activeRequests - a.activeRequests);
}
