/**
 * Merchant Center release gate.
 *
 * Product JSON-LD and the gated TSV feed share the storefront catalogue.
 * Delivery charges and transit times live in Merchant Center account
 * configuration; the website feed does not invent a delivery price or
 * unpublished lead times.
 *
 * See docs/merchant-center-release-gate.md.
 */
export const MERCHANT_CENTER_RELEASE_GATE = {
  feedEnabled: true,
  reason:
    "Merchant catalogue feed is enabled for the PLEBS 100% cotton corduroy dungarees.",
  requirements: [
    "Visible price equals JSON-LD price and feed price, in ZAR, VAT included.",
    "Use a factual feed title: brand, product, colour and size. No promotional wording.",
    "No “from”, “starting at”, estimated, sale or ex-VAT consumer prices.",
    "Static production WebP image URLs only. Not /_next/image.",
    "Availability follows live variant stock: in_stock or out_of_stock.",
    "Do not invent GTIN, dispatch times or delivery charges.",
    "Merchant Center account-level delivery settings must be configured separately.",
  ],
  deliveryComplianceWarning:
    "The feed assumes that Merchant Center account-level delivery settings contain the actual delivery charges or rates customers will pay. Website shipping remains provisional (checkout currently shows a R0.00 placeholder and timing is unpublished). If compulsory delivery charges are not configured accurately in Merchant Center, products may be disapproved.",
} as const;
