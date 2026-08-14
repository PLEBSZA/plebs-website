import { formatMoney } from "@/lib/money";
import { productData } from "@/lib/product";
import type {
  StorefrontCatalogue,
  StorefrontColour,
  StorefrontSize,
} from "@/lib/commerce/storefront-types";

/**
 * Single static → StorefrontCatalogue converter.
 * Used by getStorefrontCatalogue() when the DB has no product row, and by the
 * client provider when no catalogue was passed from the server.
 */
export function catalogueFromStatic(): StorefrontCatalogue {
  const fallbackColour = productData.colours[0];
  const colours: StorefrontColour[] = productData.colours.map((colour) => ({
    id: colour.id,
    name: colour.name,
    slug: colour.slug,
    code: colour.id === "forest-green" ? "FGR" : colour.id.toUpperCase(),
    available: colour.available,
    image: colour.image,
  }));
  const sizes: StorefrontSize[] = productData.sizes.map((size) => ({
    id: size.id,
    name: size.name,
    code: size.name,
    available: size.available,
    stockQuantity: size.stockQuantity,
    sku: size.sku ?? "",
    variantId: size.id,
    lowStockThreshold: productData.lowStockThreshold,
  }));

  return {
    productId: "static-fallback",
    name: productData.name,
    shortName: productData.shortName,
    slug: productData.slug,
    path: productData.path,
    brand: productData.brand,
    category: productData.category,
    description: productData.description,
    material: productData.material,
    condition: productData.condition,
    currency: productData.currency,
    productGroupId: productData.productGroupId,
    price: productData.price,
    priceDisplay: productData.priceDisplay ?? formatMoney(productData.price),
    commerceEnabled: productData.commerceEnabled,
    cartEnabled: productData.cartEnabled,
    lowStockThreshold: productData.lowStockThreshold,
    images: {
      front: productData.images.front,
      gallery: [...productData.images.gallery],
      social: productData.images.social,
      logo: productData.images.logo,
    },
    colours,
    sizes,
    variants: sizes.map((size) => ({
      id: size.id,
      sku: size.sku,
      colourId: fallbackColour?.id ?? "forest-green",
      colourName: fallbackColour?.name ?? "Forest Green",
      sizeId: size.id,
      sizeName: size.name,
      retailPrice: productData.price,
      available: size.stockQuantity,
      onHand: size.stockQuantity,
      reserved: 0,
      status: "ACTIVE",
      feedStatus: "PUBLISHED",
    })),
    feedPublicationStatus: "PUBLISHED",
    googleProductCategory: "7132",
    identifierExists: false,
    feedTitle: productData.name,
  };
}
