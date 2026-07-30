# PLEBS media asset map

Production media is generated with `node scripts/prepare-media.mjs`. Supplied
working files are preserved under `assets/source/plebs/` and are not publicly
served.

## Delivery pipeline (next/image)

- `next.config.ts` serves **AVIF first**, then WebP (`formats: ['image/avif', 'image/webp']`).
- Optimized image CDN cache TTL is **30 days** (`minimumCacheTTL`). Product photos
  change rarely; replacing an image requires a **new filename** or a Vercel image
  cache purge, or visitors may keep seeing the old transform.
- Storefront sources under `public/images/products/` are capped at a **1920 px**
  longest edge in `prepare-media.mjs` — nothing on the site requests larger via
  `sizes`. Email JPEGs and social OG WebPs are unchanged (inbox / crawler formats).

## Source-to-production mapping

| Supplied source | Production asset | Purpose |
| --- | --- | --- |
| `hero.webp` | `public/images/products/cotton-corduroy-dungarees/plebs-campaign-editorial.webp` | Primary homepage/product hero; forest green corduroy with PLEBS label |
| `PLEB_2.webp` | `public/images/products/cotton-corduroy-dungarees/plebs-picnic-lifestyle.webp` | Outdoor picnic lifestyle view |
| `PLEB_3.webp` | `public/images/products/cotton-corduroy-dungarees/plebs-picnic-sharing.webp` | Alternate outdoor campaign view |
| `2 (1) SVG LOGO.txt` | `public/images/brand/plebs-logo.svg` | Sanitised PLEBS signature logo |
| `2 (1) SVG LOGO.txt` | `public/images/brand/plebs-wordmark.svg` | Sanitised PLEBS wordmark |
| `PLEB_2.webp` and wordmark | `public/images/social/plebs-og-default.webp` | Default 1200×630 social card |
| `hero.webp` and wordmark | `public/images/social/plebs-og-product.webp` | Product 1200×630 social card |

The supplied SVG contained five paths: four wordmark letters spelling PLEB and
one path containing the tagline. The production logo preserves every supplied
path, adds a fifth wordmark letter for the confirmed PLEBS name, removes no
geometry, and contains no scripts, event handlers, external references,
embedded fonts, metadata, masks, gradients or IDs.

## Excluded source files

- PNG files are lossless working copies and remain outside public delivery.
- `PLEB.pdf` remains a source document and is not used by the website.
- `White Elegant Modern Calligraphy Wedding Thank You Card.pdf` is unrelated
  and excluded from all website media.

## Current photography gaps

The supplied photographs are campaign and lifestyle images. They do not provide
a clean front, back, side, fastening, pocket, stitching, care-label,
measurement-diagram or true macro fabric view. Existing placeholders for those
specific needs are intentionally retained rather than mislabelling a lifestyle
crop.

Publication permission for the identifiable people shown must be confirmed
before production release.
