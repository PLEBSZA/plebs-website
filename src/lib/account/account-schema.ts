import { z } from "zod";
import {
  SOUTH_AFRICAN_PROVINCES,
  type SouthAfricanProvince,
} from "@/lib/checkout/provinces";

function isSouthAfricanProvince(value: string): value is SouthAfricanProvince {
  return (SOUTH_AFRICAN_PROVINCES as readonly string[]).includes(value);
}

export const accountProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Enter your first name.")
    .max(80, "First name is too long."),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter your last name.")
    .max(80, "Last name is too long."),
  phone: z
    .string()
    .trim()
    .max(32, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
});

export const accountAddressSchema = z.object({
  id: z.string().trim().optional().or(z.literal("")),
  firstName: z
    .string()
    .trim()
    .min(1, "Enter the recipient first name.")
    .max(80, "First name is too long."),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter the recipient last name.")
    .max(80, "Last name is too long."),
  phone: z
    .string()
    .trim()
    .max(32, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  line1: z.string().trim().min(1, "Enter a street address.").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Enter a city.").max(80),
  province: z
    .string()
    .trim()
    .refine(isSouthAfricanProvince, "Select a South African province."),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a 4-digit South African postal code."),
});

export function flattenAccountFieldErrors(
  error: z.ZodError,
): Record<string, string[] | undefined> {
  const fields: Record<string, string[] | undefined> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) {
      fields[key] = [issue.message];
    }
  }
  return fields;
}
