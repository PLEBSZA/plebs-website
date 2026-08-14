# Checkout, Paystack and cart persistence

Optimistic review is a UI concern. Neon remains the source of truth for
orders, reservations and payment readiness.

## Session and idempotency

- The browser generates one `checkoutKey` UUID per checkout attempt and stores
  it in `sessionStorage` (`plebs:checkout-key`). It is not PII.
- `POST /api/checkout/` upserts the pending order by `checkoutKey` inside
  **one Prisma transaction**: customer upsert, order/item/payment row, and
  inventory reservation with an optimistic `version` guard.
- Editing details replays the same key. Paid or cancelled checkouts are
  immutable.
- An HttpOnly `plebs_checkout` cookie holds `orderNumber.token` for review
  recovery. Query `token` remains valid for older links and is not sent to
  analytics.

## Paystack

- After the transaction commits, checkout prepares Paystack and stores
  `authorization_url` on the pending payment.
- Pay uses `location.assign(storedUrl)`. A new initialize happens only when
  amount or email changed, or no usable redirect is stored.
- Test vs live is the secret key prefix (`sk_test_` / `sk_live_`). There is no
  code switch. Honest test-mode copy stays visible when the test key is set.

## Cart

- Cart lines persist in `sessionStorage` (`plebs:cart-line`): colour, size,
  quantity, sku, unitPrice. No address, email, or checkout token.
- The cart is cleared only after a verified paid confirmation
  (`plebs:clear-cart` from the purchase beacon).

## Copy that must stay honest

- Delivery: **Free tracked delivery in South Africa**.
- Timing: **Timing to be confirmed**. Do not invent dispatch dates.
- Paystack test mode must remain labelled when the test secret is configured.

## Owner launch gates

- Apply all four account/checkout migrations on a Neon branch before
  production, then `prisma migrate deploy` and matching application code.
- Vercel Hobby is for staging only. A live store that accepts payments needs
  a hosting plan that expressly permits commercial use.
- Switch Paystack to live keys only when hosting and the owner are ready.
  There is no automatic live-mode switch. Honest test-mode copy stays visible
  when the test key is set.
- Confirm the courier/delivery promise before changing “timing to be confirmed”.

## Reservation recovery on Hobby

Successful checkout never runs a global expiry sweep. If reservation fails
and expired ACTIVE rows may be holding this variant’s stock, checkout runs a
bounded cleanup (25 rows) **outside** the original transaction, then retries
reservation **once**. That keeps the checkout transaction small. The daily
cron remains the full recovery sweep; admin **Run maintenance now** covers
the gap between runs. Paid-order reservations are never released.
