import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  AccountTokenPurpose,
  type Prisma,
} from "@/generated/prisma/client";
import {
  ACCOUNT_SETUP_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  TOKEN_DAILY_LIMIT,
  TOKEN_RESEND_COOLDOWN_MS,
} from "@/lib/account/consent";

export type TokenTx = Prisma.TransactionClient;

export function hashAccountToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generateAccountToken(): string {
  return randomBytes(32).toString("base64url");
}

export function tokenTtlMs(purpose: AccountTokenPurpose): number {
  return purpose === AccountTokenPurpose.PASSWORD_RESET
    ? PASSWORD_RESET_TTL_MS
    : ACCOUNT_SETUP_TTL_MS;
}

export async function countRecentTokens(
  tx: TokenTx,
  userId: string,
  purpose: AccountTokenPurpose,
  since: Date,
) {
  return tx.accountToken.count({
    where: { userId, purpose, createdAt: { gte: since } },
  });
}

export async function latestLiveToken(
  tx: TokenTx,
  userId: string,
  purpose: AccountTokenPurpose,
) {
  return tx.accountToken.findFirst({
    where: {
      userId,
      purpose,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function isWithinCooldown(
  createdAt: Date,
  now = new Date(),
  cooldownMs = TOKEN_RESEND_COOLDOWN_MS,
) {
  return now.getTime() - createdAt.getTime() < cooldownMs;
}

export async function issueAccountToken(
  tx: TokenTx,
  input: { userId: string; purpose: AccountTokenPurpose },
): Promise<{ rawToken: string; cooldown: boolean; dailyLimit: boolean }> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recent = await countRecentTokens(tx, input.userId, input.purpose, dayAgo);
  if (recent >= TOKEN_DAILY_LIMIT) {
    return { rawToken: "", cooldown: false, dailyLimit: true };
  }

  const latest = await latestLiveToken(tx, input.userId, input.purpose);
  if (latest && isWithinCooldown(latest.createdAt, now)) {
    return { rawToken: "", cooldown: true, dailyLimit: false };
  }

  await tx.accountToken.updateMany({
    where: {
      userId: input.userId,
      purpose: input.purpose,
      usedAt: null,
      revokedAt: null,
    },
    data: { revokedAt: now },
  });

  const rawToken = generateAccountToken();
  await tx.accountToken.create({
    data: {
      userId: input.userId,
      purpose: input.purpose,
      tokenHash: hashAccountToken(rawToken),
      expiresAt: new Date(now.getTime() + tokenTtlMs(input.purpose)),
    },
  });

  return { rawToken, cooldown: false, dailyLimit: false };
}

export async function consumeAccountToken(
  tx: TokenTx,
  input: { rawToken: string; purpose: AccountTokenPurpose },
) {
  const tokenHash = hashAccountToken(input.rawToken);
  const token = await tx.accountToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !token ||
    token.purpose !== input.purpose ||
    token.usedAt ||
    token.revokedAt ||
    token.expiresAt <= new Date()
  ) {
    return null;
  }

  await tx.accountToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return token;
}
