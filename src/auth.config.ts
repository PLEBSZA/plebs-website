import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible Auth.js config (safe for Next.js proxy).
 * Database-backed providers and callbacks live in `src/auth.ts`.
 */
export default {
  providers: [],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (!pathname.startsWith("/admin")) {
        return true;
      }

      if (
        pathname === "/admin/login" ||
        pathname.startsWith("/admin/login/")
      ) {
        return true;
      }

      return Boolean(auth?.user);
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
