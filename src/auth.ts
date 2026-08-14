import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import authConfig from "@/auth.config";
import { normalizeEmail } from "@/lib/account/email";
import { db } from "@/lib/db";
import { sanitizeDeployedAuthEnv } from "@/lib/env";

sanitizeDeployedAuthEnv();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Auth.js (next-auth v5) application config.
 * @see https://authjs.dev/getting-started/installation?framework=Next.js
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = normalizeEmail(parsed.data.email);
        const user = await db.user.findUnique({ where: { email } });

        if (!user?.passwordHash || !user.active) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion ?? 0;
        return token;
      }

      if (!token.sub) {
        return token;
      }

      const dbUser = await db.user.findUnique({
        where: { id: token.sub },
        select: { role: true, active: true, sessionVersion: true },
      });

      if (!dbUser?.active) {
        return { ...token, sub: undefined, role: undefined, sessionVersion: undefined };
      }

      if (
        typeof token.sessionVersion === "number" &&
        dbUser.sessionVersion !== token.sessionVersion
      ) {
        return { ...token, sub: undefined, role: undefined, sessionVersion: undefined };
      }

      token.role = dbUser.role;
      token.sessionVersion = dbUser.sessionVersion;
      return token;
    },
    async session({ session, token }) {
      if (token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
