import type { DefaultSession } from "next-auth";
import type { AdminRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: AdminRole;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      role: AdminRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: AdminRole;
    sessionVersion?: number;
  }
}
