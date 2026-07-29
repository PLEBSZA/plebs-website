import "server-only";

import { cache } from "react";
import {
  ProductStatus,
  PublicationStatus,
  VariantStatus,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  brandMedia,
  cottonCorduroyDungareeImages,
  primaryProductImage,
} from "@/lib/media";
import { formatMoney } from "@/lib/money";
import { catalogueFromStatic } from "@/lib/commerce/catalogue-from-static";
import { calculateAvailableQuantity } from "@/lib/commerce/inventory-status";
import type {
  StorefrontCatalogue,
  StorefrontColour,
  StorefrontSize,
} from "@/lib/commerce/storefront-types";
import { productData as staticFallback } from "@/lib/product";

const DEFAULT_SLUG = "cotton-corduroy-dungarees";

/** Canonical storefront product accessor (DB-backed; static seed as fallback). */
export const getStorefrontCatalogue = cache(async function getStorefrontCatalogue(
  slug = DEFAULT_SLUG,
): Promise<StorefrontCatalogue> {
  const product = await db.product.findFirst({
    where: {
      slug,
      status: ProductStatus.ACTIVE,
      publicationStatus: {
        in: [
          PublicationStatus.STOREFRONT,
          PublicationStatus.STOREFRONT_AND_FEED,
        ],
      },
    },
    include: {
      options: {
        include: {
          values: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
      variants: {
        where: {
          status: { in: [VariantStatus.ACTIVE, VariantStatus.INACTIVE] },
        },
        include: {
          colourValue: true,
          sizeValue: true,
          inventoryItem: {
            include: {
              levels: {
                orderBy: { location: { fulfilmentPriority: "desc" } },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!product) {
    return catalogueFromStatic();
  }

  const colourOption = product.options.find((option) => option.code === "COLOUR");
  const sizeOption = product.options.find((option) => option.code === "SIZE");
  const activeColour = colourOption?.values[0];

  const variants = product.variants
    .map((variant) => {
      const level = variant.inventoryItem?.levels[0];
      const available = level
        ? calculateAvailableQuantity(level.onHand, level.reserved)
        : 0;

      return {
        id: variant.id,
        sku: variant.sku,
        colourId: variant.colourValue.slug,
        colourName: variant.colourValue.label,
        sizeId: variant.sizeValue.slug,
        sizeName: variant.sizeValue.label,
        retailPrice: Number(variant.retailPrice),
        available,
        onHand: level?.onHand ?? 0,
        reserved: level?.reserved ?? 0,
        status: variant.status,
        colourOrder: variant.colourValue.displayOrder,
        sizeOrder: variant.sizeValue.displayOrder,
        lowStockThreshold: level?.lowStockThreshold ?? 3,
        colourCode: variant.colourValue.code,
        sizeCode: variant.sizeValue.code,
      };
    })
    .sort(
      (a, b) =>
        a.colourOrder - b.colourOrder ||
        a.sizeOrder - b.sizeOrder,
    );

  const launchColourSlug = activeColour?.slug ?? "forest-green";
  const sizesForLaunchColour = variants.filter(
    (variant) => variant.colourId === launchColourSlug,
  );

  const price =
    sizesForLaunchColour[0]?.retailPrice ??
    variants[0]?.retailPrice ??
    staticFallback.price;

  const colours: StorefrontColour[] =
    colourOption?.values.map((value) => {
      const colourVariants = variants.filter(
        (variant) => variant.colourId === value.slug,
      );
      const purchasable = colourVariants.some(
        (variant) =>
          variant.status === VariantStatus.ACTIVE && variant.available > 0,
      );
      return {
        id: value.slug,
        name: value.label,
        slug: value.slug,
        code: value.code,
        available: purchasable || value.slug === launchColourSlug,
        image:
          value.slug === "forest-green" ? primaryProductImage.src : null,
      };
    }) ?? [];

  for (const fallbackColour of staticFallback.colours) {
    if (!colours.some((colour) => colour.id === fallbackColour.id)) {
      colours.push({
        id: fallbackColour.id,
        name: fallbackColour.name,
        slug: fallbackColour.slug,
        code:
          fallbackColour.id === "forest-green"
            ? "FGR"
            : fallbackColour.id.toUpperCase(),
        available: fallbackColour.available,
        image: fallbackColour.image,
      });
    }
  }

  const sizes: StorefrontSize[] =
    sizeOption?.values.map((value) => {
      const variant = sizesForLaunchColour.find(
        (entry) => entry.sizeId === value.slug,
      );
      const availableQty = variant?.available ?? 0;
      return {
        id: value.slug,
        name: value.label,
        code: value.code,
        available:
          Boolean(variant && variant.status === VariantStatus.ACTIVE) &&
          availableQty > 0,
        stockQuantity: availableQty,
        sku: variant?.sku ?? `PLB-D01-FGR-${value.code}`,
        variantId: variant?.id ?? "",
        lowStockThreshold: variant?.lowStockThreshold ?? 3,
      };
    }) ?? [];

  return {
    productId: product.id,
    name: product.name,
    shortName: staticFallback.shortName,
    slug: product.slug,
    path: `/products/${product.slug}/`,
    brand: product.brand,
    category: product.category,
    description: product.description ?? staticFallback.description,
    material: product.mainMaterial ?? staticFallback.material,
    condition: "https://schema.org/NewCondition",
    currency: "ZAR",
    productGroupId: product.itemGroupId,
    price,
    priceDisplay: formatMoney(price, "ZAR"),
    commerceEnabled: true,
    cartEnabled: true,
    lowStockThreshold: 3,
    images: {
      front: primaryProductImage.src,
      gallery: cottonCorduroyDungareeImages.map((image) => image.src),
      social: brandMedia.socialProduct.src,
      logo: brandMedia.logo.src,
    },
    colours,
    sizes,
    variants: variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      colourId: variant.colourId,
      colourName: variant.colourName,
      sizeId: variant.sizeId,
      sizeName: variant.sizeName,
      retailPrice: variant.retailPrice,
      available: variant.available,
      onHand: variant.onHand,
      reserved: variant.reserved,
      status: variant.status,
    })),
  };
});

export async function findStorefrontVariant(input: {
  colour: string;
  size: string;
  slug?: string;
}) {
  const catalogue = await getStorefrontCatalogue(input.slug);
  const colourKey = input.colour.trim().toLowerCase();
  const sizeKey = input.size.trim().toLowerCase();

  return (
    catalogue.variants.find((variant) => {
      const colourMatch =
        variant.colourName.toLowerCase() === colourKey ||
        variant.colourId.toLowerCase() === colourKey;
      const sizeMatch =
        variant.sizeName.toLowerCase() === sizeKey ||
        variant.sizeId.toLowerCase() === sizeKey;
      return colourMatch && sizeMatch;
    }) ?? null
  );
}
