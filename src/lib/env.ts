/**
 * Environment helpers for indexing, public URLs, and deployment safety.
 * Preview/staging must never compete with production in search results.
 * Production must never emit or redirect to loopback hosts.
 */

export const PRODUCTION_SITE_URL = "https://www.plebs.co.za";

export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost")
  );
}

export function isLoopbackUrl(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.includes("://") ? value : `http://${value}`);
    return isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

/**
 * Drop loopback AUTH_URL on Vercel production/preview so Auth.js cannot
 * build account redirects to localhost.
 */
export function sanitizeDeployedAuthEnv() {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv !== "production" && vercelEnv !== "preview") return;
  if (isLoopbackUrl(process.env.AUTH_URL)) {
    delete process.env.AUTH_URL;
  }
  if (
    vercelEnv === "production" &&
    isLoopbackUrl(process.env.NEXT_PUBLIC_SITE_URL)
  ) {
    process.env.NEXT_PUBLIC_SITE_URL = PRODUCTION_SITE_URL;
  }
}

export function shouldIndexSite(): boolean {
  if (process.env.PLEBS_NOINDEX === "true") return false;
  if (process.env.PLEBS_ALLOW_INDEXING === "false") return false;

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview" || vercelEnv === "development") return false;

  if (process.env.NODE_ENV !== "production") return false;

  // Production deploys index unless explicitly blocked above.
  return true;
}

export function getCanonicalSiteUrl(): string {
  if (process.env.VERCEL_ENV === "production") {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured && !isLoopbackUrl(configured)) {
      return stripTrailingSlash(configured);
    }
    return PRODUCTION_SITE_URL;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !isLoopbackUrl(configured)) {
    return stripTrailingSlash(configured);
  }

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  if (configured) return stripTrailingSlash(configured);
  return PRODUCTION_SITE_URL;
}

/**
 * Links that leave the app (emails, Paystack return). Never loopback, even
 * when a local `.env` still points at localhost.
 */
export function getTransactionalSiteUrl(): string {
  const canonical = getCanonicalSiteUrl();
  if (!isLoopbackUrl(canonical)) return canonical;
  return PRODUCTION_SITE_URL;
}

export function rewriteLoopbackToPublicUrl(
  url: URL,
  publicOrigin = getTransactionalSiteUrl(),
): URL {
  if (!isLoopbackHostname(url.hostname)) return url;
  const next = new URL(url.href);
  const publicUrl = new URL(publicOrigin);
  next.protocol = publicUrl.protocol;
  next.hostname = publicUrl.hostname;
  next.port = publicUrl.port;
  return next;
}

export function resolveAuthRedirectUrl(url: string, baseUrl: string): string {
  const canonical = getTransactionalSiteUrl();
  const safeBase = isLoopbackUrl(baseUrl) ? canonical : stripTrailingSlash(baseUrl);

  if (url.startsWith("/") && !url.startsWith("//")) {
    return `${safeBase}${url}`;
  }

  try {
    const next = new URL(url);
    if (isLoopbackHostname(next.hostname)) {
      return `${canonical}${next.pathname}${next.search}${next.hash}`;
    }
    if (next.origin === safeBase || next.origin === canonical) {
      return next.toString();
    }
  } catch {
    // Fall through to the canonical origin.
  }

  return `${canonical}/`;
}
