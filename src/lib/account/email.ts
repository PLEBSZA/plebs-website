import "server-only";

import { z } from "zod";

const emailSchema = z.string().trim().email();

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

export function parseNormalizedEmail(value: string): string | null {
  const normalized = normalizeEmail(value);
  return isValidEmail(normalized) ? normalized : null;
}
