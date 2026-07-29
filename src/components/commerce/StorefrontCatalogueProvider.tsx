"use client";

import { createContext, useContext, useMemo } from "react";
import type { StorefrontCatalogue } from "@/lib/commerce/storefront-types";
import { productData } from "@/lib/product";

const StorefrontCatalogueContext = createContext<StorefrontCatalogue | null>(
  null,
);

function toCatalogueFromStatic(): StorefrontCatalogue {
  return {
    ...productData,
    productId: "static-fallback",
    colours: productData.colours.map((colour) => ({
      ...colour,
      code: colour.id === "forest-green" ? "FGR" : colour.id.toUpperCase(),
    })),
    sizes: productData.sizes.map((size) => ({
      ...size,
      code: size.name,
      sku: size.sku ?? "",
      variantId: size.id,
      lowStockThreshold: productData.lowStockThreshold,
    })),
    variants: productData.sizes.map((size) => ({
      id: size.id,
      sku: size.sku ?? "",
      colourId: productData.colours[0]?.id ?? "forest-green",
      colourName: productData.colours[0]?.name ?? "Forest Green",
      sizeId: size.id,
      sizeName: size.name,
      retailPrice: productData.price,
      available: size.stockQuantity,
      onHand: size.stockQuantity,
      reserved: 0,
      status: size.available ? "ACTIVE" : "INACTIVE",
    })),
  };
}

export function StorefrontCatalogueProvider({
  catalogue,
  children,
}: {
  catalogue?: StorefrontCatalogue | null;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => catalogue ?? toCatalogueFromStatic(),
    [catalogue],
  );

  return (
    <StorefrontCatalogueContext.Provider value={value}>
      {children}
    </StorefrontCatalogueContext.Provider>
  );
}

export function useStorefrontCatalogue() {
  const context = useContext(StorefrontCatalogueContext);
  if (!context) {
    return toCatalogueFromStatic();
  }
  return context;
}

export function getCatalogueSize(
  catalogue: StorefrontCatalogue,
  sizeNameOrId: string,
) {
  const normalized = sizeNameOrId.toLowerCase();
  return catalogue.sizes.find(
    (size) =>
      size.id.toLowerCase() === normalized ||
      size.name.toLowerCase() === normalized ||
      size.code.toLowerCase() === normalized,
  );
}

export function getDefaultPurchasableCatalogueSize(
  catalogue: StorefrontCatalogue,
) {
  return catalogue.sizes.find(
    (size) => size.available && size.stockQuantity > 0,
  );
}

export function isCatalogueVariantPurchasable(
  catalogue: StorefrontCatalogue,
  input: { colour: string; size: string },
) {
  const colour = catalogue.colours.find(
    (entry) => entry.name === input.colour || entry.id === input.colour,
  );
  const size = getCatalogueSize(catalogue, input.size);
  return Boolean(
    catalogue.cartEnabled &&
      colour &&
      (colour.available || colour.id === "forest-green") &&
      size?.available &&
      size.stockQuantity > 0,
  );
}
