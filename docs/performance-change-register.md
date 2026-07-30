# PLEBS performance pack — change register

**Pack:** PLEBS-PERF-000…007 · **Date:** 2026-07-30  
**Branch tip (local):** see `git log` · **Do not treat as deployed** until a preview/production push.

## Technical choices recorded

| Decision | Choice | Why |
| --- | --- | --- |
| Caching model (PERF-002) | **Cache Components** (`cacheComponents: true`) + `'use cache'` on catalogue | Matches Next 16 public-pages guide in this repo |
| Catalogue staleness | `cacheLife("minutes")` + tag invalidation on stock/price writes | Pending owner commercial call on overselling risk |
| Image CDN TTL | 30 days | Rare product imagery; filename change or purge on update |
| Carousel autoplay | In-viewport gate only; autoplay still 4 s when visible | Pure win; disabling autoplay entirely is still an owner UX call |
| Browserslist | Chrome/Edge/Firefox ≥111, Safari ≥16.4 | Aligns with Next 16 documented modern defaults |
| GA4 strategy | **Not chosen** — see `docs/performance-ga4-decision.md` | Owner / POPIA decision |

## Commits

| Prompt | Commit | Issues |
| --- | --- | --- |
| PLEBS-PERF-001 | `37f8340` (+ Windows harness fix in QA) | SPEED-07 |
| PLEBS-PERF-002 | `4b6467e` (+ Suspense CLS fix in QA) | SPEED-01 |
| PLEBS-PERF-003 | `61994e6` | SPEED-02 |
| PLEBS-PERF-004 | `a134f89` (+ explicit `fetchPriority` in QA) | SPEED-03 |
| PLEBS-PERF-005 | `4917f16` | SPEED-04 |
| PLEBS-PERF-006 | `3a74804` | SPEED-05 |
| PLEBS-PERF-007 | report only (`docs/performance-ga4-decision.md`) | SPEED-06 |
| PLEBS-PERF-QA | `ed90e62` | CLS / LCP / harness |

## Build classification (after PERF-002+)

Content routes prerender as **○ Static** (1m revalidate / 1h expire from catalogue `cacheLife`):  
`/`, `/about`, `/care-guide`, `/contact`, `/cotton-corduroy`, `/privacy-policy`, `/products/cotton-corduroy-dungarees`, `/refund-policy`, `/shipping-returns`, `/size-guide`, `/terms`, `/checkout` (form shell).

**◐ Partial:** `/checkout/review`, `/order-confirmation`, `/admin/*`  
**ƒ Dynamic:** payment/checkout APIs, auth, sitemap (timestamp), most `/api/*`

`.next/prerender-manifest.json` lists the content routes (pass signal for SPEED-01).

## Lab deltas (local proxy — not Vercel preview)

| | Before | After (spot checks) |
| --- | --- | --- |
| Prerender content routes | none | yes |
| Home TTFB (lab, local static) | multi-second dynamic | ~10 ms |
| Home CLS | 0 | **0** (after removing site-wide Suspense hole) |
| Home images | ~629 KiB | ~310 KiB (still above 250 KiB gate) |
| PDP `fetchpriority` | missing | `fetchPriority="high"` on gallery LCP img |
| GA4 in lab | absent in old audits | ~167 KiB gtag when ID set |

**Regression caught in QA:** wrapping all `(site)` children in `<Suspense fallback={null}>` caused CLS ≈ 0.8. Suspense is now only on `/checkout/review` and `/order-confirmation`.

**Next 16 note:** `priority` preloads the image but does **not** set `fetchPriority="high"`; both are required for Lighthouse `priorityHinted`.

## Measurement notes

- Baseline `perf-baseline/2026-07-30-local-proxy.json` is a **local `next start` proxy**, not a Vercel preview.
- Production still sends `Cache-Control: no-store` until this branch is deployed.
- Re-measure: `PERF_BASE_URL=<preview> npm run perf` then `npm run perf:check`.
- Lab gates are diagnostics; **CrUX p75 over 28 days** is the real CWV verdict.

## Outstanding owner decisions

1. GA4 model (a/b/c) — `docs/performance-ga4-decision.md`
2. Confirm production SHA (Cookie Settings divergence appears closed as of 2026-07-30)
3. Accept Cache Components site-wide (recommended; already implemented locally)
4. Revalidation window for price/stock (`minutes` vs tighter)
5. Image `minimumCacheTTL` 30d vs shorter
6. Drop carousel autoplay entirely?
7. Browserslist floor OK for ZA mobile audience?

## Explicitly not done in this pack

- No production deploy / no `vercel deploy`
- No application `dependencies` added
- No accessibility opportunistic fixes
- No admin feature work beyond storefront cache invalidation hooks
- GA4 strategy not switched
- Homepage ≤250 KiB image gate not fully met on local (wordmark + hero + picnic + 2 slides)
