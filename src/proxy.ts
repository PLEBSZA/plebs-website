import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { shouldIndexSite } from "@/lib/env";
import {
  isPublicAccountPath,
  normalizePathname,
} from "@/lib/auth/authorize";

/**
 * Auth.js keeps the session alive on matched requests.
 * Custom host rules (lowercase paths, admin noindex) stay here.
 * @see https://authjs.dev/getting-started/installation?framework=Next.js
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth(function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  const session = request.auth;
  const path = normalizePathname(pathname);

  if (path.startsWith("/account") && !isPublicAccountPath(pathname)) {
    if (!session?.user?.id) {
      const url = request.nextUrl.clone();
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
