import type { NextAuthConfig } from "next-auth";
import { authorizeAdminPath } from "@/lib/auth/authorize";

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
      return authorizeAdminPath(request.nextUrl.pathname, auth?.user?.role);
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
