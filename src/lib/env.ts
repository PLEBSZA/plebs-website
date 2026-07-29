/**
 * Environment helpers for indexing and deployment safety.
 * Preview/staging must never compete with production in search results.
 */
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
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.plebs.co.za"
  );
}
