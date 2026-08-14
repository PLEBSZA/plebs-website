import { isAdminRole } from "@/lib/account/roles";

const PUBLIC_ACCOUNT_PATHS = [
  "/account/login",
  "/account/sign-in",
  "/account/register",
  "/account/forgot-password",
  "/account/activate",
  "/account/reset-password",
  "/account/confirm-newsletter",
] as const;

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isAdminLoginPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === "/admin/login";
}

export function isPublicAccountPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return PUBLIC_ACCOUNT_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Edge-safe path gate. DAL/actions still authorize independently.
 * Auth.js ignores `authorized` when a custom proxy wrapper is present, so
 * `proxy.ts` must redirect failed admin checks to `/admin/login/`.
 * /account protection stays in `proxy.ts` so customers are not sent to
 * the staff sign-in page.
 */
export function authorizeAdminPath(
  pathname: string,
  role: string | null | undefined,
): boolean {
  if (!pathname.startsWith("/admin")) return true;
  if (isAdminLoginPath(pathname)) return true;
  return isAdminRole(role);
}
