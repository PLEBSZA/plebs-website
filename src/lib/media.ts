export type ProductImageRole =
  | "primary"
  | "lifestyle"
  | "campaign"
  | "detail";

export type ProductImage = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  role: ProductImageRole;
  colourId: "forest-green";
  objectPosition: string;
  caption: string;
};

const productBase = "/images/products/cotton-corduroy-dungarees";

/**
 * Authoritative local media manifest.
 * Media belongs to the Forest Green colour, not to an individual size.
 */
export const cottonCorduroyDungareeImages = [
  {
    id: "campaign-editorial",
    src: `${productBase}/plebs-campaign-editorial.webp`,
    width: 1587,
    height: 1710,
    alt: "Two people wearing green PLEBS cotton corduroy dungarees in an editorial indoor setting.",
    role: "primary",
    colourId: "forest-green",
    objectPosition: "50% 42%",
    caption: "The PLEBS cotton corduroy dungarees styled in an editorial setting.",
  },
  {
    id: "picnic-lifestyle",
    src: `${productBase}/plebs-picnic-lifestyle.webp`,
    width: 1080,
    height: 1080,
    alt: "Two people wearing green PLEBS cotton corduroy dungarees seated together at an outdoor picnic.",
    role: "lifestyle",
    colourId: "forest-green",
    objectPosition: "50% 50%",
    caption: "PLEBS corduroy dungarees worn outdoors and styled two ways.",
  },
  {
    id: "picnic-sharing",
    src: `${productBase}/plebs-picnic-sharing.webp`,
    width: 1080,
    height: 1080,
    alt: "Two people in green PLEBS cotton corduroy dungarees sharing food at an outdoor picnic.",
    role: "campaign",
    colourId: "forest-green",
    objectPosition: "50% 50%",
    caption: "One design, worn with individual layers and accessories.",
  },
  {
    id: "lifestyle-duo-window",
    src: `${productBase}/plebs-lifestyle-duo-window.webp`,
    width: 1067,
    height: 1600,
    alt: "Two people sitting indoors in forest green PLEBS cotton corduroy dungarees, styled with layered jackets.",
    role: "lifestyle",
    colourId: "forest-green",
    objectPosition: "50% 35%",
    caption: "Layered indoor styling with the same Forest Green dungarees.",
  },
  {
    id: "lifestyle-tapestry",
    src: `${productBase}/plebs-lifestyle-tapestry.webp`,
    width: 1067,
    height: 1600,
    alt: "Person wearing forest green PLEBS cotton corduroy dungarees with a patterned shirt and maroon shawl.",
    role: "lifestyle",
    colourId: "forest-green",
    objectPosition: "50% 28%",
    caption: "Relaxed fit shown with bold layered styling.",
  },
  {
    id: "lifestyle-green-tiles",
    src: `${productBase}/plebs-lifestyle-green-tiles.webp`,
    width: 1067,
    height: 1600,
    alt: "Two people posing against green tiles in forest green PLEBS cotton corduroy dungarees.",
    role: "lifestyle",
    colourId: "forest-green",
    objectPosition: "50% 40%",
    caption: "Editorial styling that shows the wide-leg silhouette.",
  },
  {
    id: "lifestyle-sofa",
    src: `${productBase}/plebs-lifestyle-sofa.webp`,
    width: 1600,
    height: 1067,
    alt: "Person reclining on a sofa in forest green PLEBS cotton corduroy dungarees over a light shirt.",
    role: "lifestyle",
    colourId: "forest-green",
    objectPosition: "50% 45%",
    caption: "How the dungarees drape when worn casually at home.",
  },
  {
    id: "lifestyle-strap-ties",
    src: `${productBase}/plebs-lifestyle-strap-ties.webp`,
    width: 1067,
    height: 1600,
    alt: "Close-up of forest green cotton corduroy dungarees showing the bib label and knotted self-fabric straps.",
    role: "lifestyle",
    colourId: "forest-green",
    objectPosition: "50% 40%",
    caption: "Bib label and knotted strap fastening up close.",
  },
] as const satisfies readonly ProductImage[];

/** Construction and texture close-ups for the details slideshow. */
export const cottonCorduroyDetailImages = [
  {
    id: "detail-pocket-hand",
    src: `${productBase}/plebs-detail-pocket-hand.webp`,
    width: 1200,
    height: 1500,
    alt: "Close-up of forest green cotton corduroy with a side pocket and hand tucked inside, showing the ribbed texture.",
    role: "detail",
    colourId: "forest-green",
    objectPosition: "50% 45%",
    caption: "Side pocket and corduroy wale texture",
  },
  {
    id: "detail-bib-buttons",
    src: `${productBase}/plebs-detail-bib-buttons.webp`,
    width: 1200,
    height: 1500,
    alt: "Close-up of the dungaree bib placket with three tortoiseshell-style buttons on forest green corduroy.",
    role: "detail",
    colourId: "forest-green",
    objectPosition: "50% 40%",
    caption: "Bib placket and button hardware",
  },
  {
    id: "detail-bib-label",
    src: `${productBase}/plebs-detail-bib-label.webp`,
    width: 1200,
    height: 1500,
    alt: "Close-up of the bib label on forest green 100% cotton corduroy dungarees, highlighting the thick ribbed fabric.",
    role: "detail",
    colourId: "forest-green",
    objectPosition: "50% 40%",
    caption: "Bib label on ribbed cotton corduroy",
  },
  {
    id: "detail-side-pocket",
    src: `${productBase}/plebs-detail-side-pocket.webp`,
    width: 1200,
    height: 1500,
    alt: "Angled close-up of a side pocket on forest green cotton corduroy dungarees showing stitching and fabric depth.",
    role: "detail",
    colourId: "forest-green",
    objectPosition: "50% 50%",
    caption: "Pocket stitching and fabric depth",
  },
  {
    id: "detail-folded-label",
    src: `${productBase}/plebs-detail-folded-label.webp`,
    width: 1200,
    height: 1500,
    alt: "Folded forest green cotton corduroy dungarees with a brand label visible on the bib, resting on a patterned rug.",
    role: "detail",
    colourId: "forest-green",
    objectPosition: "50% 45%",
    caption: "Folded garment and label detail",
  },
] as const satisfies readonly ProductImage[];

export const primaryProductImage = cottonCorduroyDungareeImages[0];
export const lifestyleProductImage = cottonCorduroyDungareeImages[1];
export const editorialProductImage = cottonCorduroyDungareeImages[2];
export const fabricTextureImage = cottonCorduroyDetailImages[0];
export const foldedLabelWideImage = {
  src: `${productBase}/plebs-detail-folded-label-wide.webp`,
  width: 1800,
  height: 1200,
  alt: "Folded forest green cotton corduroy dungarees with a PLEBS label visible on the bib, resting on a patterned rug.",
} as const;

export const brandMedia = {
  logo: {
    src: "/images/brand/plebs-logo.svg",
    width: 606,
    height: 188,
  },
  wordmark: {
    src: "/images/brand/plebs-wordmark.svg",
    width: 606,
    height: 132,
  },
  socialDefault: {
    src: "/images/social/plebs-og-default.webp",
    width: 1200,
    height: 630,
    alt: "PLEBS 100% Cotton Corduroy Dungarees",
  },
  socialProduct: {
    src: "/images/social/plebs-og-product.webp",
    width: 1200,
    height: 630,
    alt: "PLEBS 100% Cotton Corduroy Dungarees",
  },
} as const;
