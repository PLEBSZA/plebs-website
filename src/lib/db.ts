import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // PrismaPg caches prepared statements only when `statementNameGenerator` is
    // set. Leave it unset so pooled Neon (PgBouncer) connections stay valid.
    adapter: new PrismaPg({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 8_000,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
