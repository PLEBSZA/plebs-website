import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import {
  getTransactionalSiteUrl,
  isLoopbackHostname,
  sanitizeDeployedAuthEnv,
  shouldIndexSite,
} from "@/lib/env";
import {
  authorizeAdminPath,
  isPublicAccountPath,
  normalizePathname,
} from "@/lib/auth/authorize";

sanitizeDeployedAuthEnv();

/**
 * Auth.js keeps the session alive on matched requests.
 * Custom host rules (lowercase paths, admin noindex) stay here.
 * @see https://authjs.dev/getting-started/installation?framework=Next.js
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth(function proxy(request) {
  const pageUrl = request.nextUrl.clone();
  if (
    process.env.VERCEL_ENV === "production" &&
    isLoopbackHostname(pageUrl.hostname)
  ) {
    const publicUrl = new URL(getTransactionalSiteUrl());
    pageUrl.protocol = publicUrl.protocol;
    pageUrl.hostname = publicUrl.hostname;
    pageUrl.port = publicUrl.port;
  }
  const { pathname } = pageUrl;

  if (pathname !== pathname.toLowerCase()) {
    const url = pageUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  const session = request.auth;
  const path = normalizePathname(pathname);

  if (!authorizeAdminPath(pathname, session?.user?.role)) {
    const url = pageUrl.clone();
    url.pathname = "/admin/login/";
    url.search = "";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/account") && !isPublicAccountPath(pathname)) {
    if (!session?.user?.id) {
      const url = pageUrl.clone();
      url.pathname = "/account/login/";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (
    !shouldIndexSite() ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)",
  ],
};
