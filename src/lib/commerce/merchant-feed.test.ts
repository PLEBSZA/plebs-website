import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { catalogueFromStatic } from "./catalogue-from-static";
import { MERCHANT_CENTER_RELEASE_GATE } from "./merchant";
import {
  CANONICAL_ORIGIN,
  DUNGAREE_PRODUCT_TYPE,
  GOOGLE_PRODUCT_CATEGORY,
  MERCHANT_FEED_COLUMNS,
  MERCHANT_FEED_CONTENT_TYPE,
  MERCHANT_FEED_PATH,
  MERCHANT_FEED_URL,
  buildMerchantFeedRows,
  createMerchantFeedHttpResult,
  escapeMerchantTsvField,
  formatMerchantFeedPrice,
  getMerchantFeedImageAssignment,
  getMerchantFeedVariants,
  getVariantMerchantBlockers,
  parseMerchantFeedTsv,
  type MerchantFeedEvaluationContext,
} from "./merchant-feed";
import { lifestyleProductImage, primaryProductImage } from "../media";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function eligibleContext(
  overrides: Partial<MerchantFeedEvaluationContext> = {},
): MerchantFeedEvaluationContext {
  return {
    feedEnabled: true,
    deliveryConfigured: true,
    policyPathsPresent: true,
    ...overrides,
  };
}

describe("production Merchant feed is enabled", () => {
  it("returns five dungaree TSV rows with GET-compatible content", () => {
    assert.equal(MERCHANT_CENTER_RELEASE_GATE.feedEnabled, true);
    const catalogue = catalogueFromStatic();
    assert.equal(catalogue.feedPublicationStatus, "PUBLISHED");
    assert.equal(
      catalogue.variants.every((variant) => variant.feedStatus === "PUBLISHED"),
      true,
    );

    const result = createMerchantFeedHttpResult({
      catalogue,
      context: eligibleContext(),
    });
    assert.equal(result.status, 200);
    assert.equal(result.contentType, MERCHANT_FEED_CONTENT_TYPE);
    assert.ok(result.body);

    const parsed = parseMerchantFeedTsv(result.body);
    assert.deepEqual(parsed.columns, [...MERCHANT_FEED_COLUMNS]);
    assert.equal(parsed.rows.length, 5);
    assert.deepEqual(
      parsed.rows.map((row) => row.id),
      [
        "PLB-D01-FGR-XS",
        "PLB-D01-FGR-S",
        "PLB-D01-FGR-M",
        "PLB-D01-FGR-L",
        "PLB-D01-FGR-XL",
      ],
    );

    const route = readFileSync(
      join(root, "src/app/feeds/google-merchant.tsv/route.ts"),
      "utf8",
    );
    assert.match(route, /export async function GET/);
    assert.match(route, /export async function HEAD/);
    assert.match(route, /createMerchantFeedHttpResult/);
    assert.match(route, /X-Robots-Tag/);
    assert.match(route, /noindex/);
  });
});

describe("enabled Merchant TSV content", () => {
  it("uses correct prices, availability, brand, MPN and apparel attributes", () => {
    const catalogue = catalogueFromStatic();
    const result = createMerchantFeedHttpResult({
      catalogue,
      context: eligibleContext(),
    });
    assert.equal(result.status, 200);
    const parsed = parseMerchantFeedTsv(result.body ?? "");

    for (const row of parsed.rows) {
      const variant = catalogue.variants.find((entry) => entry.sku === row.id);
      assert.ok(variant, row.id);
      assert.equal(row.price, "799.99 ZAR");
      assert.equal(row.price, formatMerchantFeedPrice(variant.retailPrice));
      assert.equal(
        row.availability,
        variant.available > 0 ? "in_stock" : "out_of_stock",
      );
      assert.equal(row.availability_date, "");
      assert.equal(row.brand, "PLEBS");
      assert.equal(row.mpn, row.id);
      assert.equal(row.identifier_exists, "false");
      assert.equal(row.condition, "new");
      assert.equal(row.google_product_category, GOOGLE_PRODUCT_CATEGORY.overalls.id);
      assert.equal(row.product_type, DUNGAREE_PRODUCT_TYPE);
      assert.equal(row.item_group_id, "PLB-D01");
      assert.equal(row.color, "Forest Green");
      assert.equal(row.gender, "unisex");
      assert.equal(row.age_group, "adult");
      assert.equal(row.material, catalogue.material);
      assert.match(
        row.link,
        /^https:\/\/www\.plebs\.co\.za\/products\/cotton-corduroy-dungarees\/\?/,
      );
      assert.match(row.link, /colour=forest-green/);
      assert.match(row.link, /size=/);
      assert.doesNotMatch(row.link, /localhost|127\.0\.0\.1|vercel\.app|\/checkout|\/admin/);
      assert.doesNotMatch(row.image_link, /_next\/image|localhost/);
      assert.doesNotMatch(
        `${row.title} ${row.description}`,
        /best|cheapest|\bsale\b|free delivery|same-day|next-day/i,
      );
    }

    const inStock = parsed.rows.filter((row) => row.availability === "in_stock");
    const outOfStock = parsed.rows.filter(
      (row) => row.availability === "out_of_stock",
    );
    assert.deepEqual(
      inStock.map((row) => row.id),
      ["PLB-D01-FGR-S"],
    );
    assert.equal(outOfStock.length, 4);
    assert.equal(
      parsed.rows.find((row) => row.id === "PLB-D01-FGR-S")?.title,
      "PLEBS 100% Cotton Corduroy Dungarees – Forest Green – S",
    );
  });

  it("fails rather than returning an empty feed when enabled with no eligible rows", () => {
    const catalogue = catalogueFromStatic();
    const result = createMerchantFeedHttpResult({
      catalogue: {
        ...catalogue,
        feedPublicationStatus: "EXCLUDED",
      },
      context: eligibleContext(),
    });
    assert.equal(result.status, 503);
    assert.doesNotMatch(result.body ?? "", /^id\t/);
  });

  it("returns 404 when the release gate is closed", () => {
    const result = createMerchantFeedHttpResult({
      context: eligibleContext({ feedEnabled: false }),
    });
    assert.equal(result.status, 404);
  });
});

describe("Merchant image mapping", () => {
  it("maps the Forest Green primary and lifestyle WebP files", () => {
    const catalogue = catalogueFromStatic();
    const variant = catalogue.variants[0];
    assert.ok(variant);
    const images = getMerchantFeedImageAssignment(catalogue, variant);
    assert.equal(
      images.imageLink,
      `${CANONICAL_ORIGIN}${primaryProductImage.src}`,
    );
    assert.equal(
      images.additionalImageLink,
      `${CANONICAL_ORIGIN}${lifestyleProductImage.src}`,
    );
    assert.equal(existsSync(join(root, "public", primaryProductImage.src.replace(/^\//, ""))), true);
    assert.equal(
      existsSync(join(root, "public", lifestyleProductImage.src.replace(/^\//, ""))),
      true,
    );
  });
});

describe("Merchant validation blockers", () => {
  it("blocks a row when delivery fulfilment is not configured", () => {
    const catalogue = catalogueFromStatic();
    const variant = catalogue.variants[0];
    assert.ok(variant);
    const blockers = getVariantMerchantBlockers(
      catalogue,
      variant,
      eligibleContext({ deliveryConfigured: false }),
    );
    assert.ok(
      blockers.some((blocker) => blocker.id === "failed-order-flow-configuration"),
    );
  });

  it("includes all five Forest Green sizes when eligible", () => {
    assert.equal(getMerchantFeedVariants().length, 5);
    assert.equal(buildMerchantFeedRows().length, 5);
  });
});

describe("feed discovery and escaping", () => {
  it("uses a stable production URL, excludes the feed from the sitemap, and does not robots-disallow it", () => {
    assert.equal(MERCHANT_FEED_PATH, "/feeds/google-merchant.tsv");
    assert.equal(
      MERCHANT_FEED_URL,
      "https://www.plebs.co.za/feeds/google-merchant.tsv",
    );
    const sitemap = readFileSync(join(root, "src/app/sitemap.ts"), "utf8");
    const site = readFileSync(join(root, "src/lib/site.ts"), "utf8");
    const robots = readFileSync(join(root, "src/app/robots.ts"), "utf8");
    assert.match(sitemap, /startsWith\("\/feeds"\)/);
    assert.doesNotMatch(robots, /\/feeds/);
    assert.doesNotMatch(site, /\/feeds/);
    for (const path of [
      "/privacy-policy/",
      "/terms/",
      "/refund-policy/",
      "/shipping-returns/",
    ]) {
      assert.match(site, new RegExp(`"${path.replaceAll("/", "\\/")}"`));
    }
  });

  it("escapes tabs and newlines in TSV fields", () => {
    assert.equal(
      escapeMerchantTsvField("line\twith\ttabs\nand a break"),
      "line with tabs and a break",
    );
  });
});
