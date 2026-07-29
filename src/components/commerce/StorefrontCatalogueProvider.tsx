"use client";

import { createContext, useContext, useMemo } from "react";
import { catalogueFromStatic } from "@/lib/commerce/catalogue-from-static";
import type { StorefrontCatalogue } from "@/lib/commerce/storefront-types";

const StorefrontCatalogueContext = createContext<StorefrontCatalogue | null>(
  null,
);

export function StorefrontCatalogueProvider({
  catalogue,
  children,
}: {
  catalogue?: StorefrontCatalogue | null;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => catalogue ?? catalogueFromStatic(),
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
    return catalogueFromStatic();
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
