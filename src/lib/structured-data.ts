import "server-only";

import { catalogueFromStatic } from "./commerce/catalogue-from-static";
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
 * ProductGroup JSON-LD fully driven by the storefront catalogue.
 * Falls back to the shared static→catalogue converter when no catalogue is passed.
 */
export function buildProductGroupJsonLd(
  catalogue?: StorefrontCatalogue | null,
): JsonLd {
  const source = catalogue ?? catalogueFromStatic();

  const productUrl = absoluteUrl(source.path);
  const groupId = `${productUrl}#product-group`;

  const variants = source.variants.map((variant) => {
    const variantUrl = new URL(source.path, getCanonicalSiteUrl());
    variantUrl.searchParams.set(
      "colour",
      source.colours.find((colour) => colour.id === variant.colourId)?.slug ??
        variant.colourId,
    );
    variantUrl.searchParams.set("size", variant.sizeId);

    const jsonLdVariant: JsonLd = {
      "@type": "Product",
      "@id": `${productUrl}#${variant.colourId}-${variant.sizeId}`,
      name: `${source.name} – ${variant.colourName} – ${variant.sizeName}`,
      color: variant.colourName,
      size: variant.sizeName,
      sku: variant.sku,
      mpn: variant.sku,
      isVariantOf: { "@id": groupId },
      url: variantUrl.toString(),
      offers: {
        "@type": "Offer",
        url: variantUrl.toString(),
        priceCurrency: source.currency,
        price: variant.retailPrice,
        availability:
          variant.available > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: source.condition,
      },
    };

    if (source.images.gallery.length > 0) {
      jsonLdVariant.image = source.images.gallery.map(getAbsoluteAssetUrl);
    }

    return jsonLdVariant;
  });

  return {
    "@type": "ProductGroup",
    "@id": groupId,
    name: source.name,
    description: source.description,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: source.brand,
    },
    material: source.material,
    image: source.images.gallery.map(getAbsoluteAssetUrl),
    variesBy: ["https://schema.org/color", "https://schema.org/size"],
    hasVariant: variants,
    productGroupID: source.productGroupId,
  };
}

export function buildGraph(nodes: Array<JsonLd | null | undefined>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}
