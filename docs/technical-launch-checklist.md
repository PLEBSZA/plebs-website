# PLEBS Technical Launch Checklist

Use this before Search Console and merchant setup. Mark each item only when verified against the live production domain.

## Crawl and indexation

- [ ] Production domain resolves correctly (`https://www.plebs.co.za`)
- [ ] Apex host redirects to the www canonical (or the reverse, if hostname choice changes)
- [ ] HTTPS redirects correctly
- [ ] Canonical tags are self-referencing on all indexable pages
- [ ] `/sitemap.xml` loads and lists only canonical indexable URLs
- [ ] `/robots.txt` allows public pages and disallows checkout/account/admin/order-confirmation
- [ ] Preview and staging deployments send `noindex`
- [ ] No accidental global `noindex` remains on production
- [ ] Variant query states canonicalise to `/products/cotton-corduroy-dungarees/`

## Metadata

- [ ] Every page has a unique title
- [ ] Every page has a useful unique description
- [ ] Open Graph images render correctly
- [ ] Favicon and social cards are installed
- [ ] No placeholder domains remain in live metadata

## Content structure

- [ ] One H1 per page
- [ ] H2/H3 hierarchy is logical
- [ ] Internal links are crawlable with descriptive anchors
- [ ] No empty supporting pages remain
- [ ] No Lorem Ipsum or unverified product claims remain

## Product data

- [ ] Price, currency, stock, SKU, colour and size are confirmed
- [ ] `productData.commerceEnabled` is true only after commerce is live
- [ ] Visible product page, structured data, cart and shopping feed match
- [ ] No fabricated ratings or review markup

## Performance

- [ ] Hero and first product image are compressed with reserved dimensions
- [ ] Lower galleries are lazy-loaded
- [ ] Fonts stay within two families and limited weights
- [ ] Mobile has no horizontal overflow
- [ ] Sticky purchase and consent UI do not cover critical controls
- [ ] No major layout shift on first load
- [ ] No console errors on homepage or product page

## Analytics and consent

- [ ] GA4 Measurement ID is set in production (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [ ] Analytics loads without a cookie banner; Realtime shows page views
- [ ] Email/restock forms require an explicit marketing consent checkbox
- [ ] `view_item`, `select_colour`, `select_size` and `add_to_cart` payloads are validated
- [ ] Purchase events are deduplicated by order ID once checkout exists
- [ ] Test orders are separated from production reporting

## Search and shopping launch

- [ ] Search Console verifies the canonical production domain
- [ ] Sitemap is submitted
- [ ] Homepage and product URL inspection succeeds
- [ ] Structured-data reports are reviewed
- [ ] Merchant feed uses factual titles and no invented GTIN
- [ ] Merchant TSV is submitted from `https://www.plebs.co.za/feeds/google-merchant.tsv`
- [ ] Merchant Center account-level delivery charges match the actual checkout charge

## Checkout and payments

- [ ] All four Prisma migrations are applied in order on a Neon branch, then production (`add_customer_role`, `customer_accounts_consent`, `checkout_key`, `order_inventory_hold`)
- [ ] `CRON_SECRET` is set on Vercel; Hobby cron runs once daily (`0 4 * * *`)
- [ ] Cart Checkout CTA is visible without scrolling at 1366×600, 1280×720, 390×844 and 360×800
- [ ] Review appears immediately after local validation; Pay stays disabled until reservation + Paystack init
- [ ] Paystack live keys are configured only when taking real payments; test mode copy remains visible on test keys
- [ ] Delivery copy still says timing is to be confirmed until a courier promise exists
- [ ] Cart survives refresh until a verified paid confirmation

