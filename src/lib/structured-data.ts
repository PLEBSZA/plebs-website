import "server-only";

import { getCanonicalSiteUrl } from "./env";
import { getAbsoluteAssetUrl, productData } from "./product";
import { siteConfig } from "./site";
import type { StorefrontCatalogue } from "./commerce/storefront-types";

type JsonLd = Record<string, unknown>;

export function absoluteUrl(path = "/"): string {
  return new URL(path, getCanonicalSiteUrl()).toString();
}

export function buildOrganizationJsonLd(): JsonLd {
  const siteUrl = getCanonicalSiteUrl();

  return {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteUrl,
    description: siteConfig.description,
    logo: {
      "@type": "ImageObject",
      url: getAbsoluteAssetUrl(productData.images.logo),
      width: 606,
      height: 188,
    },
  };
}

export function buildWebSiteJsonLd(): JsonLd {
  const siteUrl = getCanonicalSiteUrl();

  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; path: string }>,
): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqPageJsonLd(
  faqs: ReadonlyArray<{ question: string; answer: string }>,
): JsonLd | null {
  if (faqs.length === 0) return null;

  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * ProductGroup JSON-LD fully driven by DB variants via the storefront catalogue.
 * Falls back to static product data when catalogue is unavailable.
 */
export function buildProductGroupJsonLd(
  catalogue?: StorefrontCatalogue | null,
): JsonLd {
  if (!catalogue) {
    return buildStaticProductGroupJsonLd();
  }

  const productUrl = absoluteUrl(catalogue.path);
  const groupId = `${productUrl}#product-group`;

  const variants = catalogue.variants.map((variant) => {
    const variantUrl = new URL(catalogue.path, getCanonicalSiteUrl());
    variantUrl.searchParams.set(
      "colour",
      catalogue.colours.find((colour) => colour.id === variant.colourId)?.slug ??
        variant.colourId,
    );
    variantUrl.searchParams.set("size", variant.sizeId);

    const jsonLdVariant: JsonLd = {
      "@type": "Product",
      "@id": `${productUrl}#${variant.colourId}-${variant.sizeId}`,
      name: `${catalogue.name} – ${variant.colourName} – ${variant.sizeName}`,
      color: variant.colourName,
      size: variant.sizeName,
      sku: variant.sku,
      isVariantOf: { "@id": groupId },
      url: variantUrl.toString(),
      offers: {
        "@type": "Offer",
        url: variantUrl.toString(),
        priceCurrency: catalogue.currency,
        price: variant.retailPrice,
        availability:
          variant.available > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: catalogue.condition,
      },
    };

    if (catalogue.images.gallery.length > 0) {
      jsonLdVariant.image = catalogue.images.gallery.map(getAbsoluteAssetUrl);
    }

    return jsonLdVariant;
  });

  const group: JsonLd = {
    "@type": "ProductGroup",
    "@id": groupId,
    name: catalogue.name,
    description: catalogue.description,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: catalogue.brand,
    },
    material: catalogue.material,
    image: catalogue.images.gallery.map(getAbsoluteAssetUrl),
    variesBy: ["https://schema.org/color", "https://schema.org/size"],
    hasVariant: variants,
    productGroupID: catalogue.productGroupId,
  };

  return group;
}

/** Legacy static fallback when DB catalogue is unavailable. */
function buildStaticProductGroupJsonLd(): JsonLd {
  const productUrl = absoluteUrl(productData.path);
  const groupId = `${productUrl}#product-group`;

  const availableColours = productData.colours.filter(
    (colour) => colour.available,
  );

  const variants = availableColours.flatMap((colour) =>
    productData.sizes.map((size) => {
      const variant: JsonLd = {
        "@type": "Product",
        "@id": `${productUrl}#${colour.id}-${size.id}`,
        name: `${productData.name} – ${colour.name} – ${size.name}`,
        color: colour.name,
        size: size.name,
        isVariantOf: { "@id": groupId },
        url: getProductVariantUrl(colour.slug, size.id),
      };

      if (colour.image) {
        variant.image = productData.images.gallery.map(getAbsoluteAssetUrl);
      }

      if (size.sku) {
        variant.sku = size.sku;
      }

      variant.offers = {
        "@type": "Offer",
        url: getProductVariantUrl(colour.slug, size.id),
        priceCurrency: productData.currency,
        availability:
          size.available && size.stockQuantity > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: productData.condition,
        ...(productData.commerceEnabled && productData.price != null
          ? { price: productData.price }
          : {}),
      };

      return variant;
    }),
  );

  const group: JsonLd = {
    "@type": "ProductGroup",
    "@id": groupId,
    name: productData.name,
    description: productData.description,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: productData.brand,
    },
    material: productData.material,
    image: productData.images.gallery.map(getAbsoluteAssetUrl),
    variesBy: ["https://schema.org/color", "https://schema.org/size"],
    hasVariant: variants,
  };

  if (productData.productGroupId) {
    group.productGroupID = productData.productGroupId;
  }

  return group;
}

function getProductVariantUrl(colourSlug: string, sizeId: string): string {
  const url = new URL(productData.path, getCanonicalSiteUrl());
  url.searchParams.set("colour", colourSlug);
  url.searchParams.set("size", sizeId);
  return url.toString();
}

export function buildGraph(nodes: Array<JsonLd | null | undefined>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}
