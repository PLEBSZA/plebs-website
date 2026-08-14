import { z } from "zod";
import {
  SOUTH_AFRICAN_PROVINCES,
  type SouthAfricanProvince,
} from "./provinces";

function isSouthAfricanProvince(value: string): value is SouthAfricanProvince {
  return (SOUTH_AFRICAN_PROVINCES as readonly string[]).includes(value);
}

export const checkoutAddressSchema = z.object({
  line1: z.string().trim().min(1, "Enter your street address."),
  line2: z.string().trim().optional(),
  suburb: z.string().trim().min(1, "Enter your suburb."),
  city: z.string().trim().min(1, "Enter your city."),
  province: z
    .string()
    .trim()
    .refine(isSouthAfricanProvince, "Select a South African province."),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a 4-digit South African postal code."),
  country: z.literal("South Africa"),
});

export const checkoutCustomerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a phone number the courier can reach.")
    .regex(/^[+0-9 ()-]{10,20}$/, "Enter a valid phone number."),
});

export const checkoutDetailsSchema = z
  .object({
    checkoutKey: z.string().uuid("Checkout session is invalid."),
    customer: checkoutCustomerSchema,
    shippingAddress: checkoutAddressSchema,
    billingSameAsShipping: z.boolean(),
    billingAddress: checkoutAddressSchema.optional(),
    shippingMethodId: z.string().min(1),
    colour: z.string().trim().min(1),
    size: z.string().trim().min(1),
    quantity: z.number().int().min(1),
  })
  .superRefine((value, ctx) => {
    if (!value.billingSameAsShipping && !value.billingAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["billingAddress"],
        message: "Enter a billing address, or keep it the same as shipping.",
      });
    }
  });

export type CheckoutDetailsInput = z.infer<typeof checkoutDetailsSchema>;
export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

export function flattenCheckoutFieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

const FLAT_FIELD_NAMES: Record<string, string> = {
  "customer.email": "email",
  "customer.firstName": "firstName",
  "customer.lastName": "lastName",
  "customer.phone": "phone",
  "shippingAddress.line1": "shippingLine1",
  "shippingAddress.line2": "shippingLine2",
  "shippingAddress.suburb": "shippingSuburb",
  "shippingAddress.city": "shippingCity",
  "shippingAddress.province": "shippingProvince",
  "shippingAddress.postalCode": "shippingPostalCode",
  "billingAddress.line1": "billingLine1",
  "billingAddress.line2": "billingLine2",
  "billingAddress.suburb": "billingSuburb",
  "billingAddress.city": "billingCity",
  "billingAddress.province": "billingProvince",
  "billingAddress.postalCode": "billingPostalCode",
};

export function checkoutFieldInputName(path: string) {
  return FLAT_FIELD_NAMES[path] ?? path;
}

export function firstCheckoutInputName(fields: Record<string, string>) {
  const order = Object.keys(FLAT_FIELD_NAMES);
  const match = order.find((path) => fields[path]);
  return match ? FLAT_FIELD_NAMES[match] : Object.keys(fields)[0];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function checkoutInputFromRequestBody(body: Record<string, unknown>) {
  if (body.customer && typeof body.customer === "object") {
    const { unitPrice: _unitPrice, total: _total, price: _price, ...rest } =
      body;
    return rest;
  }

  const billingSame = body.billingSameAsShipping !== false;
  return {
    checkoutKey: body.checkoutKey,
    customer: {
      email: asString(body.email),
      firstName: asString(body.firstName),
      lastName: asString(body.lastName),
      phone: asString(body.phone),
    },
    shippingAddress: {
      line1: asString(body.shippingLine1),
      line2: asString(body.shippingLine2) || undefined,
      suburb: asString(body.shippingSuburb),
      city: asString(body.shippingCity),
      province: asString(body.shippingProvince),
      postalCode: asString(body.shippingPostalCode),
      country: "South Africa" as const,
    },
    billingSameAsShipping: billingSame,
    billingAddress: billingSame
      ? undefined
      : {
          line1: asString(body.billingLine1),
          line2: asString(body.billingLine2) || undefined,
          suburb: asString(body.billingSuburb),
          city: asString(body.billingCity),
          province: asString(body.billingProvince),
          postalCode: asString(body.billingPostalCode),
          country: "South Africa" as const,
        },
    shippingMethodId: asString(body.shippingMethodId) || "standard",
    colour: asString(body.colour),
    size: asString(body.size),
    quantity: Number(body.quantity ?? 1),
  };
}
