# Performance measurement (PLEBS-PERF-001)

Lab numbers from Lighthouse are **diagnostics**. The real performance gate is
Chrome User Experience Report (CrUX) field data at the **75th percentile over a
rolling 28-day window**, read from PageSpeed Insights or Search Console Core
Web Vitals. A low-traffic new property may not appear in CrUX yet — that is an
owner follow-up, not something this harness invents.

## Run the harness

```bash
# Prefer a Vercel preview URL (function + Neon + CDN path):
PERF_BASE_URL=https://your-preview.vercel.app npm run perf

# Or explicitly label a local production proxy (TTFB is NOT representative):
npm run build
npm run start   # separate terminal
npm run perf -- --base-url=http://127.0.0.1:3000 --label=local-proxy

# Exit non-zero when lab thresholds fail:
npm run perf -- --base-url=… --check
```

The script **refuses to run** if no base URL is supplied. It never silently
defaults to localhost.

## What it measures

Routes (3 mobile Lighthouse runs each, **median** reported):

| Route | Why |
|---|---|
| `/` | Commercial homepage |
| `/products/cotton-corduroy-dungarees/` | PDP |
| `/about/`, `/size-guide/`, `/shipping-returns/` | Static-copy proof of prerender |
| `/checkout/` | Legitimate dynamic control |

Per route: performance score, LCP, TTFB, Speed Index, TBT, CLS, total bytes,
image bytes, script bytes. Also records response headers (`cache-control`,
`age`, `x-vercel-cache`, `content-encoding`) and the current
`.next/prerender-manifest.json` route list.

## Lab thresholds (`--check`)

| Check | Threshold |
|---|---|
| Performance on `/` and PDP | ≥ 0.95 |
| CLS | ≤ 0.1 |
| TBT | ≤ 150 ms |
| Homepage Speed Index | ≤ 3.0 s |
| Homepage initial image bytes | ≤ 250 KiB |

These are **not** wired into deploy CI in this pack — run them manually.

## Artefacts

- Committed summaries: `perf-baseline/*.json`
- Raw multi-megabyte Lighthouse JSON: `.perf-raw/` (gitignored)
- Stale files `.lighthouse-home.json` / `.lighthouse-pdp.json` were captured
  against **localhost** and must not be cited as production baselines.

## Interpreting `x-vercel-cache`

| Value | Meaning |
|---|---|
| `HIT` | CDN served a cached response (expected after static prerender) |
| `MISS` / `BYPASS` | Origin / function path (expected on dynamic routes) |

Local `next start` will not set `x-vercel-cache`.
