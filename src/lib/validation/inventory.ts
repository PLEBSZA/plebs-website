import { z } from "zod";
import { InventoryMovementReason } from "@/generated/prisma/client";

export const inventoryAdjustmentSchema = z
  .object({
    inventoryLevelId: z.string().min(1),
    mode: z.enum(["delta", "set"]),
    quantity: z.number().int(),
    reasonCode: z.nativeEnum(InventoryMovementReason),
    note: z.string().max(1000).optional(),
    expectedVersion: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "delta" && value.quantity === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Enter a non-zero adjustment quantity.",
      });
    }
    if (value.mode === "set" && value.quantity < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Counted quantity cannot be negative.",
      });
    }
  });

export type InventoryAdjustmentFormValues = z.infer<
  typeof inventoryAdjustmentSchema
>;
