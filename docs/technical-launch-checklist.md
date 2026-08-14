# PLEBS Technical Launch Checklist

Use this before Search Console and merchant setup. Mark each item only when verified against the live production domain.

## Hosting and commercial use

Vercel currently limits Hobby cron jobs to once daily and describes Hobby as
restricted to **non-commercial personal use**. A live store that accepts
payments must use Pro or another hosting plan that expressly permits
commercial checkout. Hobby is suitable for low-volume staging only.

- [ ] Hosting plan expressly permits commercial checkout (not Vercel Hobby)
- [ ] Paystack remains in **test mode** until that hosting gate is confirmed
- [ ] Live Paystack keys are an owner-controlled launch step, never automatic

See [Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) and
[Hobby plan](https://vercel.com/docs/plans/hobby).

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

- [ ] Apply all four Prisma migrations **on a Neon branch first**, in order:
      `20260814090000_add_customer_role`,
      `20260814090100_customer_accounts_consent`,
      `20260814100000_checkout_key`,
      `20260814120000_order_inventory_hold`
- [ ] Test signup, reset, checkout, Paystack callback/webhook, reservation
      expiry, inventory hold, and admin “Run maintenance now” against that branch
- [ ] Back up production
- [ ] Apply the same four migrations with `prisma migrate deploy`
- [ ] Deploy compatible application code immediately afterward
- [ ] Set `CRON_SECRET` in Vercel only (32+ bytes of entropy, never
      `NEXT_PUBLIC_`). Hobby cron: `GET /api/cron/integration-outbox/` at
      `0 2 * * *` (02:00 UTC), 60s, 15 outbox jobs, 25 reservation expiries
- [ ] Confirm hosting permits commercial use (Hobby is staging-only)
- [ ] Confirm Paystack **live** keys separately; keep test mode until both
      hosting and live-key gates are complete
- [ ] Cart Checkout CTA is visible without scrolling at 1366×600, 1280×720, 390×844 and 360×800
- [ ] Review appears immediately after local validation; Pay stays disabled until reservation + Paystack init
- [ ] Delivery copy still says timing is to be confirmed until a courier promise exists
- [ ] Cart survives refresh until a verified paid confirmation
- [ ] Header Sign in at 320/360/375/768 does not overflow; account lives in the
      mobile drawer. Desktop (≥900) keeps Sign in / initials in the header.

