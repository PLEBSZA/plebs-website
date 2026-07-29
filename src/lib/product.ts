import { getCanonicalSiteUrl } from "./env";
import {
  brandMedia,
  cottonCorduroyDungareeImages,
  primaryProductImage,
} from "./media";
import { formatMoney } from "./money";

/**
 * Single source of product truth for UI, structured data, analytics and feeds.
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

export function buildAnalyticsItem(input?: {
  colour?: string;
  size?: string;
  quantity?: number;
  sku?: string | null;
}) {
  const colour = input?.colour ?? productData.colours[0]?.name;
  const size = input?.size;
  const variant = [colour, size].filter(Boolean).join(" / ");

  return {
    item_id: input?.sku ?? productData.productGroupId ?? productData.slug,
    item_name: productData.name,
    item_brand: productData.brand,
    item_category: productData.category,
    item_variant: variant || undefined,
    quantity: input?.quantity ?? 1,
    ...(productData.commerceEnabled && productData.price != null
      ? { price: productData.price }
      : {}),
  };
}

export function buildShoppingFeedRow(input?: {
  colourId?: string;
  sizeId?: string;
}) {
  const colour =
    productData.colours.find((entry) => entry.id === input?.colourId) ??
    productData.colours[0];
  const size = productData.sizes.find((entry) => entry.id === input?.sizeId);

  return {
    id:
      [productData.productGroupId, colour?.id, size?.id]
        .filter(Boolean)
        .join("-") || productData.slug,
    title: size
      ? `PLEBS 100% Cotton Corduroy Dungarees – ${colour?.name} – ${size.name}`
      : `PLEBS 100% Cotton Corduroy Dungarees – ${colour?.name}`,
    description:
      "PLEBS relaxed-fit dungarees made from 100% cotton corduroy. Designed for comfortable layering and everyday wear. View the product page for garment measurements, care instructions, delivery and exchange information.",
    link: getProductUrl({
      colour: colour?.slug,
      size: size?.id,
    }),
    image_link: colour?.image
      ? getAbsoluteAssetUrl(colour.image)
      : undefined,
    additional_image_link:
      colour?.id === "forest-green"
        ? cottonCorduroyDungareeImages
            .slice(1)
            .map((image) => getAbsoluteAssetUrl(image.src))
        : [],
    availability:
      colour?.available && size?.available && (size?.stockQuantity ?? 0) > 0
        ? "in_stock"
        : "out_of_stock",
    price:
      productData.commerceEnabled && productData.price != null
        ? `${productData.price} ${productData.currency}`
        : undefined,
    brand: productData.brand,
    condition: "new",
    color: colour?.name,
    size: size?.name,
    material: productData.material,
    gtin: null as string | null,
    identifier_exists: false,
  };
}

export function buildShoppingFeedRows() {
  return productData.colours
    .filter((colour) => colour.available)
    .flatMap((colour) =>
      productData.sizes.map((size) =>
        buildShoppingFeedRow({
          colourId: colour.id,
          sizeId: size.id,
        }),
      ),
    );
}
