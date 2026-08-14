/**
 * PLEBS-ORDERS-007 — Auto-complete delivered orders after a quiet period.
 *
 * Defaults to dry-run. Pass --live to write.
 * Requires ORDER_AUTO_COMPLETE_QUIET_PERIOD_DAYS (owner decision; no default).
 *
 * Prefer the HTTP trigger when the app is running:
 *   GET or POST /api/cron/auto-complete-orders
 *   Authorization: Bearer $CRON_SECRET or $ORDER_AUTO_COMPLETE_CRON_SECRET
 *   ?live=1 to write (omit for dry-run)
 *
 *   npx tsx scripts/auto-complete-orders.ts
 *   npx tsx scripts/auto-complete-orders.ts --live
 */

import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });
config({ path: ".env" });

const live = process.argv.includes("--live");

async function main() {
  const quietRaw = process.env.ORDER_AUTO_COMPLETE_QUIET_PERIOD_DAYS?.trim();
  const quietPeriodDays =
    quietRaw && Number.isFinite(Number(quietRaw)) ? Number(quietRaw) : null;

  if (quietPeriodDays == null || quietPeriodDays <= 0) {
    console.info(
      "ORDER_AUTO_COMPLETE_QUIET_PERIOD_DAYS is unset or invalid; auto-complete no-op.",
    );
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    const cutoff = new Date(
      Date.now() - quietPeriodDays * 24 * 60 * 60 * 1000,
    );

    const orders = await db.order.findMany({
      where: {
        status: "OPEN",
        paymentStatus: "PAID",
        fulfilmentStatus: "DELIVERED",
        fulfilments: {
          some: {
            deliveredAt: { lt: cutoff, not: null },
          },
        },
        returnRequests: {
          none: {
            status: { notIn: ["CLOSED", "REJECTED", "REFUNDED"] },
          },
        },
      },
      include: {
        fulfilments: { orderBy: { createdAt: "desc" }, take: 1 },
        returnRequests: { select: { id: true, status: true } },
      },
      take: 100,
    });

    const candidates = orders.map((order) => ({
      id: order.id,
      number: order.number,
      deliveredAt: order.fulfilments[0]?.deliveredAt?.toISOString() ?? null,
    }));

    if (!live) {
      console.log(
        JSON.stringify(
          {
            configured: true,
            dryRun: true,
            quietPeriodDays,
            candidates,
            message: `Dry-run: ${candidates.length} order(s) would be completed.`,
          },
          null,
          2,
        ),
      );
      return;
    }

    const completed: string[] = [];
    for (const order of orders) {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      await db.auditEvent.create({
        data: {
          actorId: null,
          action: "order.completed",
          entityType: "order",
          entityId: order.id,
          reason: `auto-complete after ${quietPeriodDays}-day quiet period`,
          afterState: {
            status: "COMPLETED",
            source: "scripts/auto-complete-orders.ts",
          },
        },
      });
      completed.push(order.id);
    }

    console.log(
      JSON.stringify(
        {
          configured: true,
          dryRun: false,
          quietPeriodDays,
          candidates,
          completed,
        },
        null,
        2,
      ),
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
