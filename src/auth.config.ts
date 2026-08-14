import type { NextAuthConfig } from "next-auth";
import { authorizeAdminPath } from "@/lib/auth/authorize";
import { resolveAuthRedirectUrl, sanitizeDeployedAuthEnv } from "@/lib/env";

sanitizeDeployedAuthEnv();

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
    redirect({ url, baseUrl }) {
      return resolveAuthRedirectUrl(url, baseUrl);
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
