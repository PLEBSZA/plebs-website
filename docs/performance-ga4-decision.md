# PLEBS-PERF-007 — GA4 third-party decision (SPEED-06)

**Status:** Blocked on owner decision. No loading-strategy change merged.

**Audit date:** 2026-07-30

## What HEAD does today

- `GoogleAnalytics` mounts on every marketing page via `(site)` / `MarketingShell`.
- Loads `googletagmanager.com/gtag/js` with `strategy="afterInteractive"` when
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is non-empty.
- No cookie banner / ConsentProvider (removed in `4f2c50b`).
- Email / restock / newsletter forms still require explicit marketing consent.
- `ConversionEvents` / `PurchaseBeacon` / `flushPendingGaEvents()` still queue
  until the script `onLoad`.

## Local vs production (re-checked 2026-07-30)

| Check | Result |
| --- | --- |
| Live `/shipping-returns/` “Cookie Settings” | **Absent** — production matches post-`4f2c50b` behaviour |
| Live HTML GA / gtag references | **Present** |
| Live `cache-control` | `private, no-cache, no-store, …` (SPEED-01 still live; PERF-002 not deployed) |
| Live `x-vercel-cache` | `MISS` on first probe |
| `.env.example` / launch checklist | Already describe unconditional GA (updated in `4f2c50b`) |

Earlier pack notes that production still showed Cookie Settings are **stale** as of this check. Confirm the deployed commit in the Vercel dashboard if you need an exact SHA.

## Measured cost

Local `.env.local` has a measurement ID set. Re-run after deploy:

```bash
PERF_BASE_URL=https://<preview>.vercel.app npm run perf
```

Compare `thirdPartyBytes` / script bytes with and without the ID on the preview.
Until that preview run is recorded in `perf-baseline/`, treat GA cost as **not yet quantified on the production rendering path**.

## Options (owner picks one)

### (a) Keep unconditional loading; optimise delivery only

- Confirm `afterInteractive` (already set).
- Optional: `preconnect` to `https://www.googletagmanager.com`.
- Ensure the tag never competes with LCP (verify after PERF-002/004).
- **POPIA:** owner accepts analytics without a prior opt-in banner (not legal advice).

### (b) Restore consent gate (recover from `4f2c50b`)

- Best lab performance for visitors who decline.
- Restore `ConsentProvider` / `CookieConsent` / footer settings control.
- Pending-event queue already fits this path — verify no drop/double-send.

### (c) Server-side / first-party analytics only

- Remove client GTM tag; keep conversion logging server-side or via a lighter beacon.
- Largest performance win; product/analytics trade-offs to define.

## Documentation

No further doc fix required for the “loads only after cookies” claim — that wording is already gone from `.env.example` and `docs/technical-launch-checklist.md` on HEAD.

## Owner actions

1. Choose **(a)**, **(b)**, or **(c)** and record it here.
2. Confirm production deployment SHA in Vercel.
3. After choice, implement in a follow-up commit (not this pack’s merge of a strategy).
