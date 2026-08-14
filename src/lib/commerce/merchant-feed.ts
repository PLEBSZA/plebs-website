import { catalogueFromStatic } from "@/lib/commerce/catalogue-from-static";
import { MERCHANT_CENTER_RELEASE_GATE } from "@/lib/commerce/merchant";
import type {
  StorefrontCatalogue,
  StorefrontVariant,
} from "@/lib/commerce/storefront-types";
import {
  lifestyleProductImage,
  primaryProductImage,
} from "@/lib/media";
import { shippingMethods } from "@/lib/shipping";
import { siteConfig } from "@/lib/site";

export const CANONICAL_ORIGIN = "https://www.plebs.co.za" as const;
export const MERCHANT_FEED_PATH = "/feeds/google-merchant.tsv" as const;
export const MERCHANT_FEED_URL = `${CANONICAL_ORIGIN}${MERCHANT_FEED_PATH}`;
export const MERCHANT_FEED_CONTENT_TYPE =
  "text/tab-separated-values; charset=utf-8" as const;

/**
 * Verified Google product taxonomy ID from
 * https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 *
 * 7132 — Apparel & Accessories > Clothing > One-Pieces > Overalls
 */
export const GOOGLE_PRODUCT_CATEGORY = {
  overalls: {
    id: "7132",
    path: "Apparel & Accessories > Clothing > One-Pieces > Overalls",
  },
} as const;

export const DUNGAREE_PRODUCT_TYPE =
  "Apparel > Dungarees > Cotton Corduroy Dungarees" as const;

export const MERCHANT_FEED_COLUMNS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "availability_date",
  "price",
  "condition",
  "brand",
  "mpn",
  "identifier_exists",
  "google_product_category",
  "product_type",
  "item_group_id",
  "color",
  "size",
  "gender",
  "age_group",
  "material",
] as const;

export type MerchantFeedColumn = (typeof MERCHANT_FEED_COLUMNS)[number];
export type MerchantFeedRow = Record<MerchantFeedColumn, string>;

const REQUIRED_ROW_COLUMNS: readonly MerchantFeedColumn[] = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "availability",
  "price",
  "condition",
  "brand",
  "mpn",
  "identifier_exists",
  "google_product_category",
  "product_type",
  "item_group_id",
  "color",
  "size",
  "gender",
  "age_group",
  "material",
];

const REQUIRED_POLICY_PATHS = [
  "/privacy-policy/",
  "/terms/",
  "/refund-policy/",
  "/shipping-returns/",
] as const;

const PROMOTIONAL_COPY =
  /best|cheapest|\bsale\b|free delivery|same-day|next-day|limited time|% off/i;

export type MerchantFeedBlocker = {
  id: string;
  message: string;
};

export type MerchantFeedEvaluationContext = {
  feedEnabled: boolean;
  deliveryConfigured: boolean;
  policyPathsPresent: boolean;
};

export type MerchantFeedImageAssignment = {
  imageLink?: string;
  additionalImageLink?: string;
  blockers: MerchantFeedBlocker[];
};

export type MerchantFeedHttpResult = {
  status: 200 | 404 | 503;
  body: string | null;
  contentType: string;
};

function productionAssetUrl(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_ORIGIN}${withLeading}`;
}

function productionPageUrl(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const withSlash = withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
  return `${CANONICAL_ORIGIN}${withSlash}`;
}

function hasRequiredPolicyPages(): boolean {
  return REQUIRED_POLICY_PATHS.every((path) =>
    siteConfig.routes.some((route) => route.path === path),
  );
}

function isDeliveryFulfilmentConfigured(): boolean {
  return shippingMethods.some(
    (method) => method.id === "standard" && method.trackingIncluded,
  );
}

export function getDefaultMerchantFeedContext(): MerchantFeedEvaluationContext {
  return {
    feedEnabled: MERCHANT_CENTER_RELEASE_GATE.feedEnabled,
    deliveryConfigured: isDeliveryFulfilmentConfigured(),
    policyPathsPresent: hasRequiredPolicyPages(),
  };
}

export function escapeMerchantTsvField(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").replace(/ {2,}/g, " ").trim();
}

export function formatMerchantFeedPrice(amount: number): string {
  return `${amount.toFixed(2)} ZAR`;
}

function isAbsoluteProductionUrl(
  url: string,
  options: { allowSearch?: boolean } = {},
): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== "www.plebs.co.za") return false;
    if (!options.allowSearch && parsed.search) return false;
    if (/localhost|127\.0\.0\.1|vercel\.app/i.test(url)) return false;
    return true;
  } catch {
    return false;
  }
}

function isStaticWebpUrl(url: string): boolean {
  return (
    isAbsoluteProductionUrl(url) &&
    url.endsWith(".webp") &&
    !url.includes("/_next/image")
  );
}

function colourHasMerchantImage(
  catalogue: StorefrontCatalogue,
  colourId: string,
): boolean {
  const colour = catalogue.colours.find((entry) => entry.id === colourId);
  if (colour?.image) return true;
  return colourId === "forest-green" && Boolean(catalogue.images.front);
}

export function getMerchantFeedImageAssignment(
  catalogue: StorefrontCatalogue,
  variant: StorefrontVariant,
): MerchantFeedImageAssignment {
  const blockers: MerchantFeedBlocker[] = [];

  if (!colourHasMerchantImage(catalogue, variant.colourId)) {
    blockers.push({
      id: "missing-image",
      message: `${variant.sku} has no Merchant-eligible colour image.`,
    });
    return { blockers };
  }

  return {
    imageLink: productionAssetUrl(primaryProductImage.src),
    additionalImageLink: productionAssetUrl(lifestyleProductImage.src),
    blockers,
  };
}

function buildFeedTitle(
  catalogue: StorefrontCatalogue,
  variant: StorefrontVariant,
): string {
  const base = catalogue.feedTitle.trim() || catalogue.name;
  return `${base} – ${variant.colourName} – ${variant.sizeName}`;
}

function buildFeedDescription(catalogue: StorefrontCatalogue): string {
  return [
    catalogue.description,
    "100% cotton corduroy at 350 GSM.",
    "Relaxed dungaree silhouette.",
    "VAT included.",
    "South African tracked delivery. Delivery charges are not included in the product price.",
  ].join(" ");
}

function googleProductCategoryId(catalogue: StorefrontCatalogue): string {
  const fromCatalogue = catalogue.googleProductCategory?.trim();
  if (fromCatalogue === GOOGLE_PRODUCT_CATEGORY.overalls.id) {
    return fromCatalogue;
  }
  return GOOGLE_PRODUCT_CATEGORY.overalls.id;
}

function identifierValue(catalogue: StorefrontCatalogue): "yes" | "false" {
  return catalogue.identifierExists ? "yes" : "false";
}

export function getVariantMerchantBlockers(
  catalogue: StorefrontCatalogue,
  variant: StorefrontVariant,
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
): MerchantFeedBlocker[] {
  const blockers: MerchantFeedBlocker[] = [];

  if (catalogue.feedPublicationStatus !== "PUBLISHED") {
    blockers.push({
      id: "merchant-flag",
      message: `${catalogue.slug} remains feedPublicationStatus: ${catalogue.feedPublicationStatus}.`,
    });
  }

  if (variant.feedStatus !== "PUBLISHED") {
    blockers.push({
      id: "merchant-flag",
      message: `${variant.sku} remains feedStatus: ${variant.feedStatus}.`,
    });
  }

  if (variant.status !== "ACTIVE") {
    blockers.push({
      id: "inactive-variant",
      message: `${variant.sku} is not an active variant.`,
    });
  }

  if (!variant.sku || !catalogue.name || !catalogue.description) {
    blockers.push({
      id: "incomplete-catalogue-fields",
      message: `${variant.sku || catalogue.slug} is missing required catalogue fields.`,
    });
  }

  if (
    catalogue.currency !== "ZAR" ||
    !Number.isFinite(variant.retailPrice) ||
    variant.retailPrice <= 0
  ) {
    blockers.push({
      id: "missing-price",
      message: `${variant.sku} must have a VAT-inclusive ZAR price.`,
    });
  }

  const images = getMerchantFeedImageAssignment(catalogue, variant);
  blockers.push(...images.blockers);
  if (!images.imageLink) {
    blockers.push({
      id: "missing-image",
      message: `${variant.sku} has no Merchant image_link.`,
    });
  } else if (!isStaticWebpUrl(images.imageLink)) {
    blockers.push({
      id: "broken-image-url",
      message: `${variant.sku} image_link is not an absolute production WebP URL.`,
    });
  }

  if (
    images.additionalImageLink &&
    !isStaticWebpUrl(images.additionalImageLink)
  ) {
    blockers.push({
      id: "broken-image-url",
      message: `${variant.sku} additional_image_link is not an absolute production WebP URL.`,
    });
  }

  const productUrl = new URL(productionPageUrl(catalogue.path));
  productUrl.searchParams.set("colour", variant.colourId);
  productUrl.searchParams.set("size", variant.sizeId);
  if (
    !isAbsoluteProductionUrl(productUrl.toString(), { allowSearch: true }) ||
    productUrl.pathname.includes("/checkout") ||
    productUrl.pathname.includes("/admin")
  ) {
    blockers.push({
      id: "broken-product-url",
      message: `${variant.sku} product URL is not the absolute production canonical page.`,
    });
  }

  if (!context.deliveryConfigured) {
    blockers.push({
      id: "failed-order-flow-configuration",
      message: "Tracked South African delivery is not configured for catalogue orders.",
    });
  }

  if (!context.policyPathsPresent) {
    blockers.push({
      id: "missing-policy-page",
      message: "Privacy, terms, refund and shipping-returns pages must remain published.",
    });
  }

  if (catalogue.brand !== "PLEBS") {
    blockers.push({
      id: "invalid-identifier",
      message: "Brand must be PLEBS.",
    });
  }

  if (!variant.sku.startsWith("PLB-")) {
    blockers.push({
      id: "invalid-identifier",
      message: "MPN must equal the variant SKU.",
    });
  }

  const title = buildFeedTitle(catalogue, variant);
  const description = buildFeedDescription(catalogue);
  if (PROMOTIONAL_COPY.test(`${title} ${description}`)) {
    blockers.push({
      id: "promotional-copy",
      message: `${variant.sku} feed copy contains promotional wording.`,
    });
  }

  const expectedPrice = formatMerchantFeedPrice(variant.retailPrice);
  if (!/^\d+\.\d{2} ZAR$/.test(expectedPrice)) {
    blockers.push({
      id: "price-mismatch",
      message: `${variant.sku} feed price formatting is invalid.`,
    });
  }

  return blockers;
}

export function isVariantMerchantEligible(
  catalogue: StorefrontCatalogue,
  variant: StorefrontVariant,
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
): boolean {
  return getVariantMerchantBlockers(catalogue, variant, context).length === 0;
}

export function getMerchantFeedVariants(
  catalogue: StorefrontCatalogue = catalogueFromStatic(),
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
): StorefrontVariant[] {
  if (!context.feedEnabled) return [];
  return catalogue.variants.filter((variant) =>
    isVariantMerchantEligible(catalogue, variant, context),
  );
}

function buildMerchantFeedRow(
  catalogue: StorefrontCatalogue,
  variant: StorefrontVariant,
  context: MerchantFeedEvaluationContext,
): MerchantFeedRow | null {
  if (getVariantMerchantBlockers(catalogue, variant, context).length > 0) {
    return null;
  }

  const images = getMerchantFeedImageAssignment(catalogue, variant);
  if (!images.imageLink) return null;

  const productUrl = new URL(productionPageUrl(catalogue.path));
  productUrl.searchParams.set("colour", variant.colourId);
  productUrl.searchParams.set("size", variant.sizeId);

  return {
    id: variant.sku,
    title: escapeMerchantTsvField(buildFeedTitle(catalogue, variant)),
    description: escapeMerchantTsvField(buildFeedDescription(catalogue)),
    link: productUrl.toString(),
    image_link: images.imageLink,
    additional_image_link: images.additionalImageLink ?? "",
    availability: variant.available > 0 ? "in_stock" : "out_of_stock",
    availability_date: "",
    price: formatMerchantFeedPrice(variant.retailPrice),
    condition: "new",
    brand: "PLEBS",
    mpn: variant.sku,
    identifier_exists: identifierValue(catalogue),
    google_product_category: googleProductCategoryId(catalogue),
    product_type: DUNGAREE_PRODUCT_TYPE,
    item_group_id: catalogue.productGroupId,
    color: variant.colourName,
    size: variant.sizeName,
    gender: "unisex",
    age_group: "adult",
    material: catalogue.material,
  };
}

export function buildMerchantFeedTsv(rows: readonly MerchantFeedRow[]): string {
  const header = MERCHANT_FEED_COLUMNS.join("\t");
  const lines = rows.map((row) =>
    MERCHANT_FEED_COLUMNS.map((column) =>
      escapeMerchantTsvField(row[column]),
    ).join("\t"),
  );
  return [header, ...lines].join("\n") + "\n";
}

export function buildMerchantFeedRows(
  catalogue: StorefrontCatalogue = catalogueFromStatic(),
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
): MerchantFeedRow[] {
  return getMerchantFeedVariants(catalogue, context)
    .map((variant) => buildMerchantFeedRow(catalogue, variant, context))
    .filter((row): row is MerchantFeedRow => row !== null);
}

export function createMerchantFeedHttpResult(options?: {
  context?: Partial<MerchantFeedEvaluationContext>;
  catalogue?: StorefrontCatalogue;
}): MerchantFeedHttpResult {
  const context: MerchantFeedEvaluationContext = {
    ...getDefaultMerchantFeedContext(),
    ...options?.context,
  };
  const catalogue = options?.catalogue ?? catalogueFromStatic();

  if (!context.feedEnabled) {
    return {
      status: 404,
      body: "Not Found",
      contentType: "text/plain; charset=utf-8",
    };
  }

  const rows = buildMerchantFeedRows(catalogue, context);

  if (rows.length === 0) {
    console.error(
      "[merchant-feed] feedEnabled is true but no eligible product rows exist. Refusing to serve an empty feed.",
    );
    return {
      status: 503,
      body: "Merchant feed has no eligible products",
      contentType: "text/plain; charset=utf-8",
    };
  }

  for (const row of rows) {
    for (const column of REQUIRED_ROW_COLUMNS) {
      if (!row[column]) {
        console.error(
          `[merchant-feed] eligible row ${row.id} is missing required column ${column}.`,
        );
        return {
          status: 503,
          body: "Merchant feed has no eligible products",
          contentType: "text/plain; charset=utf-8",
        };
      }
    }
    if (row.identifier_exists !== "false") {
      console.error(
        `[merchant-feed] eligible row ${row.id} must use identifier_exists=false because no GTIN exists.`,
      );
      return {
        status: 503,
        body: "Merchant feed has no eligible products",
        contentType: "text/plain; charset=utf-8",
      };
    }
    if (row.mpn !== row.id || row.brand !== "PLEBS") {
      console.error(
        `[merchant-feed] eligible row ${row.id} has invalid brand/MPN identifiers.`,
      );
      return {
        status: 503,
        body: "Merchant feed has no eligible products",
        contentType: "text/plain; charset=utf-8",
      };
    }
  }

  return {
    status: 200,
    body: buildMerchantFeedTsv(rows),
    contentType: MERCHANT_FEED_CONTENT_TYPE,
  };
}

export function parseMerchantFeedTsv(tsv: string): {
  columns: string[];
  rows: Array<Record<string, string>>;
} {
  const lines = tsv.replace(/^\uFEFF/, "").trimEnd().split("\n");
  const columns = (lines[0] ?? "").split("\t");
  const rows = lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(
      columns.map((column, index) => [column, values[index] ?? ""]),
    );
  });
  return { columns, rows };
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildMerchantFeedRss(
  rows: readonly MerchantFeedRow[],
  siteUrl: string = CANONICAL_ORIGIN,
): string {
  const items = rows.map((row) => {
    const additional = row.additional_image_link
      ? `\n    <g:additional_image_link>${escapeXml(row.additional_image_link)}</g:additional_image_link>`
      : "";
    return `  <item>
    <g:id>${escapeXml(row.id)}</g:id>
    <title>${escapeXml(row.title)}</title>
    <description>${escapeXml(row.description)}</description>
    <link>${escapeXml(row.link)}</link>
    <g:image_link>${escapeXml(row.image_link)}</g:image_link>${additional}
    <g:availability>${escapeXml(row.availability)}</g:availability>
    <g:price>${escapeXml(row.price)}</g:price>
    <g:brand>${escapeXml(row.brand)}</g:brand>
    <g:mpn>${escapeXml(row.mpn)}</g:mpn>
    <g:condition>${escapeXml(row.condition)}</g:condition>
    <g:item_group_id>${escapeXml(row.item_group_id)}</g:item_group_id>
    <g:color>${escapeXml(row.color)}</g:color>
    <g:size>${escapeXml(row.size)}</g:size>
    <g:gender>${escapeXml(row.gender)}</g:gender>
    <g:age_group>${escapeXml(row.age_group)}</g:age_group>
    <g:material>${escapeXml(row.material)}</g:material>
    <g:google_product_category>${escapeXml(row.google_product_category)}</g:google_product_category>
    <g:product_type>${escapeXml(row.product_type)}</g:product_type>
    <g:identifier_exists>${escapeXml(row.identifier_exists)}</g:identifier_exists>
  </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${escapeXml("PLEBS")} Product Feed</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Product feed for Google Merchant Center</description>
${items.join("\n")}
</channel>
</rss>`;
}
