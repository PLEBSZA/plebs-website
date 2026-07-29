import "server-only";

import { VariantStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  calculateAvailableQuantity,
  calculateInventoryStatus,
} from "@/lib/commerce/inventory-status";

export async function listProductsForAdmin() {
  const products = await db.product.findMany({
    include: {
      variants: {
        where: { status: { not: VariantStatus.ARCHIVED } },
        include: {
          inventoryItem: {
            include: {
              levels: true,
            },
          },
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
  });

  return products.map((product) => {
    const activeVariants = product.variants.filter(
      (variant) => variant.status === VariantStatus.ACTIVE,
    );
    const prices = product.variants.map((variant) => Number(variant.retailPrice));
    const totalAvailable = product.variants.reduce((sum, variant) => {
      const level = variant.inventoryItem?.levels[0];
      if (!level) return sum;
      return sum + calculateAvailableQuantity(level.onHand, level.reserved);
    }, 0);

    return {
      id: product.id,
      name: product.name,
      status: product.status,
      publicationStatus: product.publicationStatus,
      activeVariantCount: activeVariants.length,
      totalAvailable,
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
      updatedAt: product.updatedAt,
      slug: product.slug,
    };
  });
}

export async function getVariantAvailabilityBySku(sku: string) {
  const variant = await db.productVariant.findUnique({
    where: { sku },
    include: {
      inventoryItem: {
        include: {
          levels: {
            orderBy: { location: { fulfilmentPriority: "desc" } },
            take: 1,
          },
        },
      },
    },
  });

  if (!variant?.inventoryItem?.levels[0]) return null;

  const level = variant.inventoryItem.levels[0];
  const available = calculateAvailableQuantity(level.onHand, level.reserved);

  return {
    variantId: variant.id,
    sku: variant.sku,
    status: variant.status,
    available,
    inventoryStatus: calculateInventoryStatus({
      available,
      incoming: level.incoming,
      lowStockThreshold: level.lowStockThreshold,
      variantActive: variant.status === VariantStatus.ACTIVE,
    }),
  };
}
