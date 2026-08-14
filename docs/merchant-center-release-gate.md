# Merchant Center release gate

PLEBS uses a **gated, scheduled TSV feed** as the controlled Merchant product source. Product JSON-LD remains consistent with the storefront catalogue and can also support Google’s automatic website import if enabled later.

Canonical feed URL:

`https://www.plebs.co.za/feeds/google-merchant.tsv`

The RSS mirror at `https://www.plebs.co.za/feed.xml` is generated from the same rows. Submit the TSV URL in Merchant Center.

`MERCHANT_CENTER_RELEASE_GATE.feedEnabled` is **true**. The feed returns HTTP 200 with five Forest Green size rows when validation passes. It is excluded from the XML sitemap and tagged `noindex`. It is **not** disallowed in robots.txt.

## Delivery compliance warning

The feed assumes that Merchant Center account-level delivery settings contain the actual delivery charges or rates customers will pay. Website shipping remains provisional: checkout currently shows a **R0.00** placeholder and dispatch/transit times are unpublished. If compulsory delivery charges are not configured accurately in Merchant Center, products may be disapproved.

Delivery cost and delivery time are separate requirements. Publishing copy on `/shipping-returns/` does **not** verify Merchant Center delivery-cost compliance.

Do not invent free shipping, same-day delivery or handling times in the feed.

## Google product category

| SKUs | Category ID | Path |
| --- | --- | --- |
| PLB-D01-FGR-XS, PLB-D01-FGR-S, PLB-D01-FGR-M, PLB-D01-FGR-L, PLB-D01-FGR-XL | `7132` | Apparel & Accessories > Clothing > One-Pieces > Overalls |

## Product listing

One product group, five size variants of the 100% cotton corduroy dungarees:

| Attribute | Value |
| --- | --- |
| Brand | `PLEBS` |
| Item group | `PLB-D01` |
| Colour | Forest Green |
| Sizes | XS, S, M, L, XL |
| Gender | unisex |
| Age group | adult |
| Material | 100% cotton corduroy, 350 GSM |
| Price | `799.99 ZAR` (VAT included) |
| Condition | new |
| Identifier | `identifier_exists=false` — no GTIN. Brand + MPN (SKU) still submitted. |

Earth tone is listed on the storefront as unavailable and has no variants or Merchant image. It is not submitted.

## Availability

Availability follows live inventory, not a made-to-order default.

| SKU | Launch stock in seed |
| --- | --- |
| PLB-D01-FGR-S | `in_stock` |
| XS, M, L, XL | `out_of_stock` |

No `availability_date` for `in_stock` or `out_of_stock` products.

## Image mapping

| Use | File |
| --- | --- |
| `image_link` | `/images/products/cotton-corduroy-dungarees/plebs-campaign-editorial.webp` |
| `additional_image_link` | `/images/products/cotton-corduroy-dungarees/plebs-picnic-lifestyle.webp` |

Static `https://www.plebs.co.za/images/...webp` URLs only. Not `/_next/image`.

## Eligible SKUs

All five Forest Green size SKUs are submitted when `feedPublicationStatus` and each variant `feedStatus` are `PUBLISHED` and validation passes:

- PLB-D01-FGR-XS
- PLB-D01-FGR-S
- PLB-D01-FGR-M
- PLB-D01-FGR-L
- PLB-D01-FGR-XL

If the feed is enabled but unexpectedly has zero valid rows, the endpoint returns **HTTP 503**, not an empty TSV.
