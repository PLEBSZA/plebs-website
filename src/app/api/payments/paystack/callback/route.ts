import { redirect } from "next/navigation";
import { verifyPaystackPayment, isPaystackConfigured } from "@/lib/commerce/paystack";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference || !isPaystackConfigured()) {
    redirect("/order-confirmation/?error=missing_reference");
  }

  const result = await verifyPaystackPayment(reference);

  if (result.ok) {
    redirect(
      `/order-confirmation/?order=${encodeURIComponent(result.orderNumber)}&paid=true`,
    );
  }

  redirect(`/order-confirmation/?error=payment_failed`);
}
