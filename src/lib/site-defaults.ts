import { siteConfig } from "./site";
import { getCanonicalSiteUrl } from "./env";

/**
 * Keep siteConfig.url aligned with the canonical production hostname helper.
 */
export const resolvedSiteUrl = getCanonicalSiteUrl();

export const siteDefaults = {
  name: siteConfig.name,
  defaultTitle: "PLEBS | 100% Cotton Corduroy Dungarees",
  defaultDescription:
    "PLEBS creates distinctive 100% cotton corduroy dungarees in green and earth-toned colourways, designed for individual everyday wear.",
  titleTemplate: "%s | PLEBS",
  url: resolvedSiteUrl,
} as const;
