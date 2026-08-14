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
     `/api/cron/integration-outbox/`
   - `CRON_SECRET` — Vercel Cron `Authorization: Bearer` for the scheduled GET
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
- `after()` processes the outbox after the HTTP response.
- Cron/manual retry: `GET` or `POST` `/api/cron/integration-outbox/` with
  `Authorization: Bearer <CRON_SECRET>` (Vercel) or
  `Authorization: Bearer <INTEGRATION_OUTBOX_CRON_SECRET>` (manual). This also
  expires abandoned inventory reservations. Dedicated route:
  `GET`/`POST` `/api/cron/expire-reservations/`. `vercel.json` schedules only
  the integration-outbox path once per day at 04:00 UTC (`0 4 * * *`), which
  is the Hobby-plan maximum frequency. The route sets `maxDuration` to 300
  seconds and processes up to 50 outbox jobs plus 100 reservation expiries per
  run. Orphan reservation expiry claims `ACTIVE → RELEASED` before decrementing
  reserved stock.
- Jobs left in `PROCESSING` after a crash are returned to `PENDING` after 5
  minutes.
- Token cooldown or daily-limit during email send is retryable. The outbox
  stays failed until a token can actually be issued and sent.
- Admin customer detail shows sync status, sanitized errors and retry.
- Email/Resend failure never rolls back a paid order.

## Public account recovery

- `/account/register/` accepts an email, returns the generic response, creates
  or reuses the customer, and sends setup (no password) or reset (has
  password). It does not grant newsletter consent.
- Forgot password uses the same recovery rule for unactivated accounts.
- Header signed-out control is **Sign in**, which opens a dialog (bottom sheet
  on small screens) with email, password, Forgot password, and
  **New to Plebs? Create account**. `/account/login/` and `/account/sign-in/`
  remain full-page fallbacks; `/account/register/` stays the create-account
  page and does not grant newsletter consent.
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
