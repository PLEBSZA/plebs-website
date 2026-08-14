export const DEFAULT_ACCOUNT_CALLBACK = "/account/";

function hasControlChars(value: string) {
  return /[\u0000-\u001F\u007F]/.test(value);
}

/**
 * Accepts same-site relative paths only. Rejects protocol-relative URLs,
 * absolute URLs, backslashes, and control characters.
 */
export function safeInternalCallbackPath(
  raw: unknown,
  fallback = DEFAULT_ACCOUNT_CALLBACK,
): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || hasControlChars(trimmed)) return fallback;

  try {
    const url = new URL(trimmed, "https://plebs.invalid");
    if (url.origin !== "https://plebs.invalid") return fallback;
    if (url.username || url.password) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (!path.startsWith("/") || path.startsWith("//")) return fallback;
    if (path.includes("\\") || hasControlChars(path)) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
