# PLEBS-PERF-007 — GA4 third-party decision (SPEED-06)

**Status:** **DECIDED — option (a).** Owner decision recorded 2026-07-30 by Tiaan de Lange.

**Audit date:** 2026-07-30 · **Decision date:** 2026-07-30

## Decision

**Option (a) — GA4 loads unconditionally; no cookie consent banner. Explicit opt-in consent is retained for email, newsletter and restock signup.**

Owner's stated reasoning: *"In SA consent for analytics is not necessary, but if it deals with email and subscribing to newsletters, yes."*

This confirms that `4f2c50b`'s intent was correct and it should ship as written. The split it implements — no banner for analytics, explicit consent on the email forms — is exactly the model chosen.

### What this means in code

**Nothing needs to change.** The current implementation already is option (a), correctly:

- `GoogleAnalytics.tsx` uses `strategy="afterInteractive"` — the right strategy; the tag loads after hydration and does not block first paint.
- `gtag('config', …)` already sets `anonymize_ip: true` and `send_page_view: false`. Both are worth keeping deliberately: IP anonymisation materially weakens the argument that GA4 is processing identifiable personal information, which supports the position taken here.
- Email, restock and newsletter forms retain explicit marketing consent, untouched by `4f2c50b`.

### Preconnect: deliberately NOT added

The pack listed `preconnect` to `https://www.googletagmanager.com` as optional. **It has been left out on purpose, not overlooked.**

Preconnect is only a win when the connection is used shortly after it is opened. GA4 loads at `afterInteractive`, i.e. after hydration — on this site that is *after* LCP. Preconnecting during the initial render would open a TCP + TLS connection inside the critical window, consuming bandwidth and a connection slot that the LCP image needs. That is the precise failure mode PLEBS-PERF-004 exists to avoid.

**Do not add it without measuring.** If it is ever revisited, the test is a preview-deployment A/B on LCP and TTFB with the measurement ID set — not a lab intuition. Adding it speculatively is more likely to cost LCP than to save time.

### Verification still outstanding

One item genuinely remains, and it needs a deployment:

```bash
PERF_BASE_URL=https://<preview>.vercel.app npm run perf
```

Run with `NEXT_PUBLIC_GA_MEASUREMENT_ID` set, and confirm on the production rendering path that (i) GA4 does not appear in the LCP dependency chain on `/` or the PDP, and (ii) TBT stays under the 150 ms gate with the tag live. Record the result in `perf-baseline/`. The ~167 KiB lab figure is a local-proxy number and is not yet confirmed against the real path.

## Legal note — recorded honestly, not as advice

I am not a lawyer and this is not legal advice. The decision is the owner's and it is a defensible one, but the two halves of it do not rest on equally settled ground, and that is worth having on the record:

- **Email / newsletter — the owner is on firm ground.** POPIA section 69 prohibits direct marketing by unsolicited electronic communication without consent, with a narrow "soft opt-in" for existing customers under s69(3)(a). The Information Regulator published its long-awaited Direct Marketing Guidance Note in December 2024, which practitioners read as tightening rather than relaxing this. Keeping explicit opt-in on the email forms is clearly correct.
- **Analytics — more contested than "not necessary".** POPIA has no ePrivacy-style standalone cookie-consent rule, so there is no direct South African equivalent of the EU cookie banner mandate, and that is the basis for the owner's position. However, several South African practitioner sources argue that identifying cookies and pixels constitute processing of personal information and therefore require informed consent under POPIA's general conditions. That view is not unanimous, and some of the sources advancing it most strongly sell consent tooling — but it is not a fringe reading either. `anonymize_ip: true` is the single most useful mitigation and is already in place.
- **Territorial caveat.** This reasoning is South Africa–specific. If PLEBS ever ships to or markets into the EU or UK, GDPR and the ePrivacy Directive apply and *do* require prior consent for analytics cookies — a different regime with a different answer. Revisit before any international launch. The live `/shipping-returns/` page currently states international availability is unconfirmed, so this is not yet live risk.
- **Consistency check.** `/privacy-policy/` discusses analytics and cookies in prose. Confirm its wording matches the no-banner reality before deploying, so the published policy and the site's actual behaviour agree.

Sources: [POPIA s69](https://popia.co.za/section-69-direct-marketing-by-means-of-unsolicited-electronic-communications/) · [DLA Piper — Guidance Note on Direct Marketing](https://www.dlapiperafrica.com/en/south-africa/insights/2025/Data-Protection-Guidance-Note-on-Direct-Marketing) · [Covington — Information Regulator direct-marketing guidance](https://www.globalpolicywatch.com/2024/12/long-awaited-popia-guidance-on-direct-marketing-published-by-south-africas-information-regulator/) · [Michalsons — Guidance note on direct marketing](https://www.michalsons.com/blog/guidance-note-on-direct-marketing-in-south-africa/51168) · [MJ Kotze — Direct marketing under POPIA](https://mjkinc.co.za/popia/direct-marketing)

---

## Correction to the earlier "divergence closed" finding

**The production divergence is NOT closed.** The table below recorded live "Cookie Settings" as *Absent*. Re-checked independently on 2026-07-30:

- `https://www.plebs.co.za/shipping-returns/` renders, in the footer's Legal list: Privacy Policy · Terms & Conditions · Refund Policy · **Cookie Settings**.
- `grep -rni "cookie" src/` on local `HEAD` returns **three prose matches inside `(site)/privacy-policy/page.tsx` and nothing else**. There is no Cookie Settings control anywhere in the codebase.

A control that renders in production and does not exist in `HEAD` means **production is still serving a build from before `4f2c50b`**. "Live HTML contains gtag references" does not contradict this: the pre-`4f2c50b` build shipped the GA component *and* the consent gate, with the tag loading after opt-in. Both observations describe the same older build. This is corroborated by the same table's own finding that live `cache-control` is still `no-store` — nothing from the perf branch is deployed either.

**Practical consequence of choosing (a):** deploying this branch is a real, visible behaviour change for visitors, not a no-op. The "Cookie Settings" control disappears from the footer and analytics begins loading without a prior opt-in. That is the intended outcome of the decision above — it just should not come as a surprise on deploy day, and it is the reason the privacy-policy consistency check matters.

Confirm the deployed SHA in the Vercel dashboard to close this properly. Treat the table below as the earlier check, superseded on this point.

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

1. ~~Choose **(a)**, **(b)**, or **(c)** and record it here.~~ **Done — option (a), recorded above 2026-07-30.**
2. **Confirm production deployment SHA in Vercel.** Still open, and now more relevant: the live footer still shows "Cookie Settings", so production predates `4f2c50b` and deploying this branch is a visible behaviour change.
3. ~~After choice, implement in a follow-up commit.~~ **No code change required** — the current implementation already is option (a). Preconnect deliberately omitted (see above).
4. **New:** check `/privacy-policy/` wording matches the no-banner reality before deploying.
5. **New:** run the preview-deployment verification with the measurement ID set, and confirm GA4 is absent from the LCP chain and TBT holds under 150 ms.
