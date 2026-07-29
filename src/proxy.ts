import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import authConfig from "@/auth.config";
import { shouldIndexSite } from "@/lib/env";

/**
 * Auth.js keeps the session alive on matched requests.
 * Custom host rules (lowercase paths, admin noindex) stay here.
 * @see https://authjs.dev/getting-started/installation?framework=Next.js
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth(function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!shouldIndexSite() || pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)",
  ],
};
