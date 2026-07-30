import "server-only";

import { db } from "@/lib/db";
import { getContactEmail, sendEmail } from "@/lib/email/resend";
import { emailTemplateAliases } from "@/lib/email/template-aliases";

export async function sendFulfilmentDispatchedEmail(fulfilmentId: string) {
  const fulfilment = await db.fulfilment.findUnique({
    where: { id: fulfilmentId },
    include: { order: true },
  });

  if (
    !fulfilment ||
    fulfilment.customerNotifiedAt ||
    !fulfilment.courier ||
    !fulfilment.trackingNumber
  ) {
    return;
  }

  const firstName =
    fulfilment.order.customerName.trim().split(/\s+/)[0] || "there";
  const result = await sendEmail({
    to: fulfilment.order.customerEmail,
    replyTo: getContactEmail(),
    subject: `Your PLEBS order ${fulfilment.order.number} is on its way`,
    idempotencyKey: `fulfilment-dispatched/${fulfilment.id}`,
    template: {
      id: emailTemplateAliases.shippingConfirmation,
      variables: {
        CUSTOMER_FIRST_NAME: firstName,
        ORDER_NUMBER: fulfilment.order.number,
        COURIER: fulfilment.courier,
        TRACKING_NUMBER: fulfilment.trackingNumber,
        TRACKING_URL:
          fulfilment.trackingUrl ?? "https://www.plebs.co.za/contact/",
        TRACKING_CTA: fulfilment.trackingUrl
          ? "Track your order"
          : "Get tracking help",
      },
    },
  });

  if (result.sent) {
    await db.fulfilment.update({
      where: { id: fulfilment.id },
      data: { customerNotifiedAt: new Date() },
    });
  }
}
