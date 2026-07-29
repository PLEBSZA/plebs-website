import { getCanonicalSiteUrl } from "./env";
import {
  brandMedia,
  cottonCorduroyDungareeImages,
  primaryProductImage,
} from "./media";
import { formatMoney } from "./money";

/**
 * Static seed / resilience fallback only.
 * Canonical customer-facing price, stock, and colour/size availability come from
 * getStorefrontCatalogue() (DB). Convert via catalogueFromStatic() when the DB
 * is unreachable — do not read price/availability from this object in UI,
 * analytics, structured data, or feeds.
 */
export const productData = {
  name: "PLEBS 100% Cotton Corduroy Dungarees",
  shortName: "100% Cotton Corduroy Dungarees",
  slug: "cotton-corduroy-dungarees",
  path: "/products/cotton-corduroy-dungarees/",
  brand: "PLEBS",
  category: "Corduroy Dungarees",
  description:
    "A relaxed one-piece dungaree made from 100% cotton corduroy. Designed with practical details, an easy layering fit and a strong silhouette in signature PLEBS green and earth tones.",
  material: "100% cotton corduroy",
  condition: "https://schema.org/NewCondition" as const,
  currency: "ZAR" as const,
  productGroupId: "PLB-D01",
  price: 799.99,
  priceDisplay: formatMoney(799.99, "ZAR"),
  commerceEnabled: true,
  cartEnabled: true,
  /** Show remaining-stock messaging only at or below this threshold. */
  lowStockThreshold: 3,
  images: {
    front: primaryProductImage.src,
    gallery: cottonCorduroyDungareeImages.map((image) => image.src),
    social: brandMedia.socialProduct.src,
    logo: brandMedia.logo.src,
  },
  colours: [
    {
      id: "forest-green",
      name: "Forest Green",
      slug: "forest-green",
      available: true,
      image: primaryProductImage.src,
    },
    {
      id: "earth-tone",
      name: "Earth tone",
      slug: "earth-tone",
      available: false,
      image: null as string | null,
    },
  ],
  sizes: [
    {
      id: "xs",
      name: "XS",
      available: false,
      stockQuantity: 0,
      sku: "PLB-D01-FGR-XS",
    },
    {
      id: "s",
      name: "S",
      available: true,
      /** Provisional sellable quantity — adjust via inventory admin before launch. */
      stockQuantity: 10,
      sku: "PLB-D01-FGR-S",
    },
    {
      id: "m",
      name: "M",
      available: false,
      stockQuantity: 0,
      sku: "PLB-D01-FGR-M",
    },
    {
      id: "l",
      name: "L",
      available: false,
      stockQuantity: 0,
      sku: "PLB-D01-FGR-L",
    },
    {
      id: "xl",
      name: "XL",
      available: false,
      stockQuantity: 0,
      sku: "PLB-D01-FGR-XL",
    },
  ],
} as const;

export type ProductColour = (typeof productData.colours)[number];
export type ProductSize = (typeof productData.sizes)[number];

export function getProductSize(sizeNameOrId: string): ProductSize | undefined {
  const normalized = sizeNameOrId.toLowerCase();
  return productData.sizes.find(
    (size) =>
      size.id.toLowerCase() === normalized ||
      size.name.toLowerCase() === normalized,
  );
}

export function getDefaultPurchasableSize(): ProductSize | undefined {
  return productData.sizes.find(
    (size) => size.available && size.stockQuantity > 0,
  );
}

export function isVariantPurchasable(input: {
  colour: string;
  size: string;
}): boolean {
  const colour = productData.colours.find(
    (entry) => entry.name === input.colour || entry.id === input.colour,
  );
  const size = getProductSize(input.size);
  return Boolean(
    productData.cartEnabled &&
      colour?.available &&
      size?.available &&
      size.stockQuantity > 0,
  );
}

export function getProductUrl(query?: {
  colour?: string;
  size?: string;
}): string {
  const base = new URL(productData.path, getCanonicalSiteUrl()).toString();
  if (!query?.colour && !query?.size) return base;

  const params = new URLSearchParams();
  if (query.colour) params.set("colour", query.colour);
  if (query.size) params.set("size", query.size);
  return `${base}?${params.toString()}`;
}

export function getAbsoluteAssetUrl(path: string): string {
  return new URL(path, getCanonicalSiteUrl()).toString();
}

export function buildAnalyticsItem(input: {
  catalogue: {
    name: string;
    brand: string;
    category: string;
    productGroupId: string;
    slug: string;
    commerceEnabled: boolean;
    price: number | null;
    colours: ReadonlyArray<{ name: string }>;
  };
  colour?: string;
  size?: string;
  quantity?: number;
  sku?: string | null;
}) {
  const { catalogue } = input;
  const colour = input.colour ?? catalogue.colours[0]?.name;
  const size = input.size;
  const variant = [colour, size].filter(Boolean).join(" / ");

  return {
    item_id: input.sku ?? catalogue.productGroupId ?? catalogue.slug,
    item_name: catalogue.name,
    item_brand: catalogue.brand,
    item_category: catalogue.category,
    item_variant: variant || undefined,
    quantity: input.quantity ?? 1,
    ...(catalogue.commerceEnabled && catalogue.price != null
      ? { price: catalogue.price }
      : {}),
  };
}
