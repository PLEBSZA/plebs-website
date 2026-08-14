# Customer accounts, consent and Resend operations

Neon/Prisma is the source of truth for identity, preferences and consent proof.
Resend Contacts/Topics are a synchronized delivery view.

## Safe deploy order

1. Apply Prisma migrations (`20260814090000_add_customer_role` then
   `20260814090100_customer_accounts_consent`, then
   `20260814100000_checkout_key`, then
   `20260814120000_order_inventory_hold`) against a Neon branch first.
2. Confirm existing admin rows still have `OWNER` / `OPERATIONS_ADMIN` /
   `FULFILMENT_USER` / `CONTENT_EDITOR`. The new default `CUSTOMER` applies only
   to **new** User rows.
3. Deploy application code that is role-aware at `/admin` **before** any
   automatic account creation traffic hits production.
4. Set Resend env vars on preview, then production:
   - `RESEND_NEWSLETTER_TOPIC_ID` — `PLEBS news & updates`, default `opt_out`
   - `RESEND_NEWSLETTER_SEGMENT_ID` — sendable newsletter segment
   - `RESEND_WEBHOOK_SECRET` — signed `contact.updated` webhook to
     `/api/webhooks/resend/`
   - `INTEGRATION_OUTBOX_CRON_SECRET` — retry route
     `/api/cron/integration-outbox/` (manual)
   - `CRON_SECRET` — Vercel Cron `Authorization: Bearer` for the scheduled GET.
     Generate at least 32 bytes of entropy. Store only in Vercel. This secret
     authenticates maintenance only; it does not encrypt customer data,
     authenticate shoppers, or verify Paystack.
5. Export/publish the new transactional templates with
   `npm run email:export` then owner-controlled `npm run email:sync`. Do not
   run sync against production from this agent session.
6. Optional: `npx tsx scripts/backfill-customer-accounts.ts --dry-run` then
   `--confirm`. This links Users without sending setup email.

## Consent

- Newsletter uses **double opt-in**. Footer signup records
  `PENDING_CONFIRMATION` plus exact wording/source/time. Topic `opt_in` happens
  only after `/account/confirm-newsletter/`.
- Paid purchase and restock do **not** grant `NEWSLETTER_EMAIL`.
- Checkout and restock disclose that a free account may be created.
- Restock consent stores the same wording shown on the form.
- Historic restock `marketing_consent` rows stay restock-scoped (`alertConsent`).
- Admin may suppress/opt out. Admin cannot flip a simple opt-in toggle.
  Historic proof requires date, source and evidence notes. The supplied date
  is stored as the consent event `createdAt`.

Wording versions live in `src/lib/account/consent.ts` and are still draft until
South African legal review of the privacy policy.

## Outbox and monitoring

- Preference/account writes enqueue `integration_outbox` in the same
  transaction.
- `after()` processes the outbox after the HTTP response for Create Account,
  forgot password, newsletter, restock account setup, and paid-order
  provisioning. The user-facing response does not wait for Resend. The daily
  cron is recovery for failed or interrupted work, not the normal delivery
  path.
- Jobs are claimed with a conditional `PENDING|FAILED → PROCESSING` update.
  A second worker that loses the claim does not send. Cooldown and daily-limit
  failures stay `FAILED`, never `SYNCED`. Stale `PROCESSING` jobs return to
  `PENDING` after 5 minutes. Provider errors never roll back a paid order.
- Cron/manual retry: `GET` or `POST` `/api/cron/integration-outbox/` with
  `Authorization: Bearer <CRON_SECRET>` (Vercel) or
  `Authorization: Bearer <INTEGRATION_OUTBOX_CRON_SECRET>` (manual). Missing
  secrets return 503; invalid secrets return 401. This also expires abandoned
  inventory reservations. Dedicated route:
  `GET`/`POST` `/api/cron/expire-reservations/`. `vercel.json` schedules only
  the integration-outbox path once per day at 02:00 UTC (`0 2 * * *`), which
  is the Hobby-plan maximum frequency. Duration is 60 seconds; each run
  processes up to 15 outbox jobs plus 25 reservation expiries. Orphan
  reservation expiry claims `ACTIVE → RELEASED` before decrementing reserved
  stock, and never releases a paid order.
- Admin overview **Run maintenance now** (owner / customers:manage) calls the
  same services on the server. It does not expose `CRON_SECRET` to the
  browser. It processes at most 15 outbox jobs and 25 reservations, shows
  counts only, and writes an audit event. Safe to press repeatedly.
- Admin customer detail shows sync status, sanitized errors and retry.
- Vercel Hobby is not production-ready for a live commercial store. Keep
  Paystack in test mode until hosting permits commercial checkout.

## Public account recovery

- `/account/register/` accepts an email, returns the generic response, creates
  or reuses the customer, and sends setup (no password) or reset (has
  password). It does not grant newsletter consent.
- Forgot password uses the same recovery rule for unactivated accounts.
- Header signed-out control is **Sign in**. Desktop (≥900px) opens a dialog
  with email, password, Forgot password, and **New to Plebs? Create account**.
  Below 900px the same control lives in the mobile drawer; the header keeps
  Cart only. `/account/login/` and `/account/sign-in/` remain full-page
  fallbacks; `/account/register/` stays the create-account page and does not
  grant newsletter consent.
- Signing in from checkout returns to `/checkout/` via a server-validated
  same-site `callbackUrl`. External, protocol-relative, and backslash
  destinations are rejected.
- Header signed-in control is circular initials (first + last name, else the
  first email character) opening My account, Orders, Personal details, and
  Sign out.

## Tokens

- Setup tokens: 24 hours. Password reset: 60 minutes.
- SHA-256 stored; raw token only in the email.
- Issuing a token revokes older live tokens for the same user/purpose.
- Public forgot-password responses are generic.
- Resend cooldown: 15 minutes, 5 tokens / 24 hours / purpose.

## Suppression and export

- Admin **Opt out / suppress** writes Neon immediately, then Resend `opt_out`.
- Resend dashboard unsubscribe reconciles via webhook as `SUPPRESSED`.
- Consent timeline on the customer record is the exportable proof.

## Backfill rules

- Existing admins keep their roles.
- Existing Customers may receive CUSTOMER Users only via the reviewed script.
- No historical purchase is converted to newsletter consent.
- No automatic production Resend contact opt-in.
