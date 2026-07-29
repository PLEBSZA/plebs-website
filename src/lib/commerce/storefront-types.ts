export type StorefrontColour = {
  id: string;
  name: string;
  slug: string;
  code: string;
  available: boolean;
  image: string | null;
};

export type StorefrontSize = {
  id: string;
  name: string;
  code: string;
  available: boolean;
  stockQuantity: number;
  sku: string;
  variantId: string;
  lowStockThreshold: number;
};

export type StorefrontVariant = {
  id: string;
  sku: string;
  colourId: string;
  colourName: string;
  sizeId: string;
  sizeName: string;
  retailPrice: number;
  available: number;
  onHand: number;
  reserved: number;
  status: string;
};

export type StorefrontCatalogue = {
  productId: string;
  name: string;
  shortName: string;
  slug: string;
  path: string;
  brand: string;
  category: string;
  description: string;
  material: string;
  condition: "https://schema.org/NewCondition";
  currency: "ZAR";
  productGroupId: string;
  price: number;
  priceDisplay: string;
  commerceEnabled: boolean;
  cartEnabled: boolean;
  lowStockThreshold: number;
  images: {
    front: string;
    gallery: string[];
    social: string;
    logo: string;
  };
  colours: StorefrontColour[];
  sizes: StorefrontSize[];
  variants: StorefrontVariant[];
};
