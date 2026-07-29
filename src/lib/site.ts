import { productData } from "./product";

export const siteConfig = {
  name: "PLEBS",
  legalName: "PLEBS",
  // Canonical production hostname. Keep www as the single authoritative host.
  url: "https://www.plebs.co.za",
  description:
    "PLEBS creates distinctive 100% cotton corduroy dungarees in green and earth-toned colourways, designed for individual everyday wear.",
  product: {
    name: productData.shortName,
    slug: productData.slug,
    path: productData.path,
    priceDisplay: productData.priceDisplay,
  },
  routes: [
    { path: "/", label: "Home" },
    { path: "/products/cotton-corduroy-dungarees/", label: "Dungarees" },
    { path: "/about/", label: "Our Story" },
    { path: "/cotton-corduroy/", label: "Fabric" },
    { path: "/size-guide/", label: "Size Guide" },
    { path: "/care-guide/", label: "Care Guide" },
    { path: "/shipping-returns/", label: "Shipping & Returns" },
    { path: "/contact/", label: "Contact" },
    { path: "/privacy-policy/", label: "Privacy Policy" },
    { path: "/terms/", label: "Terms" },
    { path: "/refund-policy/", label: "Refund Policy" },
  ],
  nav: [
    { href: "/products/cotton-corduroy-dungarees/", label: "Dungarees" },
    { href: "/about/", label: "Our Story" },
    { href: "/cotton-corduroy/", label: "Fabric" },
    { href: "/size-guide/", label: "Size Guide" },
  ],
} as const;
