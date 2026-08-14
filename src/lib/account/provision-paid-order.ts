import "server-only";

import { ensureCustomerAccount } from "@/lib/account/ensure-account";
import { scheduleOutboxProcessing } from "@/lib/account/outbox";
import { db } from "@/lib/db";

export async function provisionPaidOrderAccount(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      customerEmail: true,
      customerName: true,
      customerPhone: true,
    },
  });
  if (!order) return;

  const [firstName, ...rest] = order.customerName.trim().split(/\s+/);
  const lastName = rest.join(" ") || null;

  await db.$transaction((tx) =>
    ensureCustomerAccount(tx, {
      email: order.customerEmail,
      firstName: firstName || null,
      lastName,
      phone: order.customerPhone,
      source: "paid_purchase",
    }),
  );
  scheduleOutboxProcessing();
}
