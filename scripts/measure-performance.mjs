#!/usr/bin/env node
/**
 * PLEBS-PERF-001 — Lab performance harness.
 *
 * Runs Lighthouse mobile (simulated throttling) three times per route and
 * reports medians. Refuses to default to localhost — pass PERF_BASE_URL or
 * --base-url=...
 *
 * Usage:
 *   PERF_BASE_URL=https://….vercel.app npm run perf
 *   npm run perf -- --base-url=http://127.0.0.1:3000 --label=local-proxy
 *   npm run perf -- --base-url=… --check   # exit non-zero if thresholds fail
 *
 * Lab numbers are diagnostics. The real gate is CrUX field data at p75 over
 * 28 days (PageSpeed Insights / Search Console Core Web Vitals).
 */

import { spawnSync } from "node:child_process";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const rawDir = path.join(root, ".perf-raw");
const outDir = path.join(root, "perf-baseline");

const ROUTES = [
  "/",
  "/products/cotton-corduroy-dungarees/",
  "/about/",
  "/size-guide/",
  "/shipping-returns/",
  "/checkout/",
];

const RUNS = 3;

const THRESHOLDS = {
  homePerformance: 0.95,
  pdpPerformance: 0.95,
  cls: 0.1,
  tbtMs: 150,
  homeSpeedIndexMs: 3000,
  homeImageBytes: 250 * 1024,
};

function parseArgs(argv) {
  const args = { check: false, label: null, baseUrl: null, skipBuild: false };
  for (const arg of argv) {
    if (arg === "--check") args.check = true;
    else if (arg === "--skip-build") args.skipBuild = true;
    else if (arg.startsWith("--base-url=")) args.baseUrl = arg.slice("--base-url=".length);
    else if (arg.startsWith("--label=")) args.label = arg.slice("--label=".length);
  }
  return args;
}

function median(values) {
  const sorted = [...values].filter((v) => typeof v === "number" && !Number.isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function joinUrl(base, route) {
  const normalized = base.replace(/\/$/, "");
  if (route === "/") return `${normalized}/`;
  return `${normalized}${route.startsWith("/") ? route : `/${route}`}`;
}

function routeSlug(route) {
  if (route === "/") return "home";
  return route.replace(/^\/|\/$/g, "").replaceAll("/", "-") || "root";
}

async function fetchHeaders(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "plebs-perf-harness/1.0" },
    });
    return {
      status: res.status,
      "cache-control": res.headers.get("cache-control"),
      age: res.headers.get("age"),
      "x-vercel-cache": res.headers.get("x-vercel-cache"),
      "content-encoding": res.headers.get("content-encoding"),
      "content-type": res.headers.get("content-type"),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function captureBuildClassification() {
  const nextDir = path.join(root, ".next");
  const result = {
    source: "next build output / prerender-manifest",
    note: "Run after `npm run build`. ○ Static · ◐ Partial · ƒ Dynamic",
    prerenderRoutes: [],
    dynamicHint: null,
  };

  try {
    // Synchronous read via spawn of node -fs would be overkill; use readFile in caller.
  } catch {
    /* filled below */
  }

  return result;
}

async function readPrerenderManifest() {
  try {
    const raw = await readFile(
      path.join(root, ".next", "prerender-manifest.json"),
      "utf8",
    );
    const manifest = JSON.parse(raw);
    const routes = Object.keys(manifest.routes ?? {}).sort();
    return { routes, previewModeIdPresent: Boolean(manifest.preview?.previewModeId) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      routes: [],
    };
  }
}

function runLighthouse(url, outputPath) {
  const args = [
    "lighthouse",
    url,
    "--only-categories=performance",
    "--form-factor=mobile",
    "--throttling-method=simulate",
    "--chrome-flags=--headless --no-sandbox --disable-gpu",
    "--output=json",
    `--output-path=${outputPath}`,
    "--quiet",
  ];
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    args,
    {
      cwd: root,
      encoding: "utf8",
      timeout: 180_000,
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `Lighthouse failed for ${url}: ${result.stderr || result.stdout || result.status}`,
    );
  }
}

function extractMetrics(lhr) {
  const audits = lhr.audits ?? {};
  const cats = lhr.categories ?? {};
  const networkItems = audits["network-requests"]?.details?.items ?? [];
  let imageBytes = 0;
  let scriptBytes = 0;
  for (const item of networkItems) {
    const size = item.transferSize ?? item.resourceSize ?? 0;
    if (item.resourceType === "Image") imageBytes += size;
    if (item.resourceType === "Script") scriptBytes += size;
  }

  return {
    performance: cats.performance?.score ?? null,
    lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
    ttfbMs: audits["server-response-time"]?.numericValue ?? null,
    speedIndexMs: audits["speed-index"]?.numericValue ?? null,
    tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    totalBytes: audits["total-byte-weight"]?.numericValue ?? null,
    imageBytes,
    scriptBytes,
  };
}

function formatRow(route, m) {
  const pct = (v) => (v == null ? "—" : (v * 100).toFixed(0) + "%");
  const ms = (v) => (v == null ? "—" : `${Math.round(v)} ms`);
  const kib = (v) => (v == null ? "—" : `${(v / 1024).toFixed(0)} KiB`);
  return [
    route,
    pct(m.performance),
    ms(m.lcpMs),
    ms(m.ttfbMs),
    ms(m.speedIndexMs),
    ms(m.tbtMs),
    m.cls == null ? "—" : m.cls.toFixed(3),
    kib(m.totalBytes),
    kib(m.imageBytes),
    kib(m.scriptBytes),
  ];
}

function checkThresholds(byRoute) {
  const failures = [];
  const home = byRoute["/"];
  const pdp = byRoute["/products/cotton-corduroy-dungarees/"];

  if (home) {
    if ((home.performance ?? 0) < THRESHOLDS.homePerformance) {
      failures.push(
        `Home performance ${(home.performance * 100).toFixed(0)}% < ${THRESHOLDS.homePerformance * 100}%`,
      );
    }
    if ((home.cls ?? 0) > THRESHOLDS.cls) {
      failures.push(`Home CLS ${home.cls} > ${THRESHOLDS.cls}`);
    }
    if ((home.tbtMs ?? 0) > THRESHOLDS.tbtMs) {
      failures.push(`Home TBT ${Math.round(home.tbtMs)} ms > ${THRESHOLDS.tbtMs} ms`);
    }
    if ((home.speedIndexMs ?? 0) > THRESHOLDS.homeSpeedIndexMs) {
      failures.push(
        `Home Speed Index ${Math.round(home.speedIndexMs)} ms > ${THRESHOLDS.homeSpeedIndexMs} ms`,
      );
    }
    if ((home.imageBytes ?? 0) > THRESHOLDS.homeImageBytes) {
      failures.push(
        `Home image bytes ${Math.round(home.imageBytes / 1024)} KiB > ${THRESHOLDS.homeImageBytes / 1024} KiB`,
      );
    }
  }
  if (pdp) {
    if ((pdp.performance ?? 0) < THRESHOLDS.pdpPerformance) {
      failures.push(
        `PDP performance ${(pdp.performance * 100).toFixed(0)}% < ${THRESHOLDS.pdpPerformance * 100}%`,
      );
    }
    if ((pdp.cls ?? 0) > THRESHOLDS.cls) {
      failures.push(`PDP CLS ${pdp.cls} > ${THRESHOLDS.cls}`);
    }
    if ((pdp.tbtMs ?? 0) > THRESHOLDS.tbtMs) {
      failures.push(`PDP TBT ${Math.round(pdp.tbtMs)} ms > ${THRESHOLDS.tbtMs} ms`);
    }
  }
  return failures;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = (args.baseUrl || process.env.PERF_BASE_URL || "").trim();

  if (!baseUrl) {
    console.error(
      "Refusing to run without a base URL.\n" +
        "Set PERF_BASE_URL or pass --base-url=https://….vercel.app\n" +
        "Do not measure localhost unless you explicitly pass it and label the run as a local proxy.",
    );
    process.exit(2);
  }

  const isLocal =
    /localhost|127\.0\.0\.1/i.test(baseUrl) ||
    args.label === "local-proxy";
  const label =
    args.label ||
    (isLocal ? "local-proxy" : "preview-or-production");
  const stamp = new Date().toISOString().slice(0, 10);

  await mkdir(rawDir, { recursive: true });
  await mkdir(outDir, { recursive: true });

  const prerender = await readPrerenderManifest();
  const headersByRoute = {};
  for (const route of ROUTES) {
    headersByRoute[route] = await fetchHeaders(joinUrl(baseUrl, route));
  }

  const runsByRoute = {};
  for (const route of ROUTES) {
    runsByRoute[route] = [];
    const url = joinUrl(baseUrl, route);
    console.error(`Measuring ${route} (${RUNS} runs)…`);
    for (let i = 1; i <= RUNS; i++) {
      const outPath = path.join(rawDir, `${routeSlug(route)}-run${i}.json`);
      runLighthouse(url, outPath);
      const lhr = JSON.parse(await readFile(outPath, "utf8"));
      runsByRoute[route].push(extractMetrics(lhr));
    }
  }

  const medians = {};
  for (const route of ROUTES) {
    const runs = runsByRoute[route];
    const keys = Object.keys(runs[0] ?? {});
    const m = {};
    for (const key of keys) {
      m[key] = median(runs.map((r) => r[key]));
    }
    medians[route] = m;
  }

  const summary = {
    capturedAt: new Date().toISOString(),
    baseUrl,
    label,
    measurementKind: isLocal
      ? "local-proxy (TTFB not production-representative)"
      : "remote (preview or production)",
    runsPerRoute: RUNS,
    formFactor: "mobile",
    throttlingMethod: "simulate",
    thresholds: THRESHOLDS,
    note:
      "Lab diagnostics only. Field gate = CrUX p75 over 28 days via PSI / Search Console.",
    staleLocalhostReports:
      ".lighthouse-home.json and .lighthouse-pdp.json (if present) were captured against localhost and must not be cited as production baselines.",
    prerenderManifest: prerender,
    responseHeaders: headersByRoute,
    routes: medians,
  };

  const outFile = path.join(outDir, `${stamp}-${label}.json`);
  await writeFile(outFile, JSON.stringify(summary, null, 2));

  const header = [
    "Route",
    "Perf",
    "LCP",
    "TTFB",
    "SI",
    "TBT",
    "CLS",
    "Total",
    "Images",
    "Scripts",
  ];
  const rows = ROUTES.map((route) => formatRow(route, medians[route]));
  console.log(`\nBase URL: ${baseUrl}`);
  console.log(`Label: ${label} · ${summary.measurementKind}`);
  console.log(`Prerendered routes (${prerender.routes?.length ?? 0}): ${(prerender.routes ?? []).join(", ") || "(none / missing manifest)"}`);
  console.log("\n" + [header, ...rows].map((r) => r.join("\t")).join("\n"));
  console.log(`\nWrote ${path.relative(root, outFile)}`);

  const failures = checkThresholds(medians);
  if (failures.length) {
    console.error("\nThreshold failures:");
    for (const f of failures) console.error(`  - ${f}`);
  } else {
    console.error("\nAll lab thresholds passed.");
  }

  if (args.check && failures.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
