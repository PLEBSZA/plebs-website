import type { Metadata } from "next";
import { shouldIndexSite, getCanonicalSiteUrl } from "./env";
import { brandMedia } from "./media";
import { siteConfig } from "./site";

export const defaultOgImage = {
  url: brandMedia.socialDefault.src,
  width: brandMedia.socialDefault.width,
  height: brandMedia.socialDefault.height,
  alt: brandMedia.socialDefault.alt,
} as const;

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  /** When true, title is used as-is and skips the root `%s | PLEBS` template. */
  absoluteTitle?: boolean;
  image?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  type?: "website" | "article";
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  absoluteTitle = false,
  image = defaultOgImage,
  type = "website",
}: PageMetaInput): Metadata {
  const siteUrl = getCanonicalSiteUrl();
  const url = new URL(path, siteUrl).toString();
  const indexable = shouldIndexSite() && !noIndex;
  const imageUrl = image.url.startsWith("http")
    ? image.url
    : new URL(image.url, siteUrl).toString();

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: path,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_ZA",
      type,
      images: [
        {
          url: imageUrl,
          width: image.width ?? 1200,
          height: image.height ?? 630,
          alt: image.alt ?? title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
