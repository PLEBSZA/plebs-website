/**
 * PLEBS-ORDERS-001 — Historical COMPLETED backfill (owner decision required)
 *
 * Context: Before this change, `fulfilOrder()` wrote `OrderStatus.COMPLETED`
 * at dispatch. Those rows are indistinguishable from genuinely delivered
 * orders because `Fulfilment.deliveredAt` was never set.
 *
 * Modes (choose one — do not guess):
 *   --mode=leave   (RECOMMENDED) Document-only: leave historical COMPLETED
 *                  rows untouched. Reasoning: resetting OPEN/FULFILLED on
 *                  already-shipped orders would flood the Open tab with
 *                  work that may already be done, without knowing which
 *                  parcels actually arrived.
 *   --mode=reset   Reset COMPLETED → OPEN where fulfilment is FULFILLED
 *                  (or equivalent) and deliveredAt IS NULL. Use only when
 *                  the owner confirms those orders still need delivery
 *                  confirmation.
 *
 * Usage (local / scratch DB only — do not run against production without
 * an explicit owner decision):
 *   npx tsx scripts/backfill-completed-orders.ts --mode=leave --dry-run
 *   npx tsx scripts/backfill-completed-orders.ts --mode=reset --dry-run
 *   npx tsx scripts/backfill-completed-orders.ts --mode=reset
 */

import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });
config({ path: ".env" });

const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg?.slice("--mode=".length) ?? "leave";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (mode !== "leave" && mode !== "reset") {
    console.error('Invalid --mode. Use "leave" or "reset".');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    const candidates = await db.order.findMany({
      where: {
        status: "COMPLETED",
        fulfilments: {
          none: { deliveredAt: { not: null } },
        },
      },
      select: {
        id: true,
        number: true,
        fulfilmentStatus: true,
        completedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `Found ${candidates.length} COMPLETED order(s) with no deliveredAt.`,
    );

    if (mode === "leave") {
      console.log(
        "[leave] No writes. Treat these rows as pre-migration COMPLETED records.",
      );
      for (const order of candidates) {
        console.log(`  - ${order.number} (${order.fulfilmentStatus})`);
      }
      return;
    }

    if (dryRun) {
      console.log("[reset][dry-run] Would reset the following to OPEN:");
      for (const order of candidates) {
        console.log(`  - ${order.number} (${order.fulfilmentStatus})`);
      }
      return;
    }

    const result = await db.order.updateMany({
      where: {
        id: { in: candidates.map((entry) => entry.id) },
      },
      data: {
        status: "OPEN",
        completedAt: null,
      },
    });

    console.log(`[reset] Updated ${result.count} order(s) to OPEN.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
