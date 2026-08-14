import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, AdminRole } from "../src/generated/prisma/client";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

/**
 * Optional owner-run backfill: create CUSTOMER users for existing commerce
 * customers that have no User, without sending setup email.
 *
 *   npx tsx scripts/backfill-customer-accounts.ts --dry-run
 *   npx tsx scripts/backfill-customer-accounts.ts --confirm
 */
async function main() {
  const confirm = process.argv.includes("--confirm");
  const dryRun = !confirm || process.argv.includes("--dry-run");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  const customers = await db.customer.findMany({
    where: { userId: null },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  console.log(`Customers without a linked user: ${customers.length}`);
  if (dryRun) {
    console.log("Dry run only. Pass --confirm to write. No emails are sent.");
    await db.$disconnect();
    return;
  }

  let linked = 0;
  for (const customer of customers) {
    const email = customer.email.trim().toLowerCase();
    const existingUser = await db.user.findUnique({ where: { email } });
    const user =
      existingUser ??
      (await db.user.create({
        data: {
          email,
          name: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || null,
          role: AdminRole.CUSTOMER,
          active: true,
        },
      }));
    await db.customer.update({
      where: { id: customer.id },
      data: { userId: user.id },
    });
    linked += 1;
  }

  console.log(`Linked ${linked} customers. No setup emails were sent.`);
  await db.$disconnect();
}

void main();
