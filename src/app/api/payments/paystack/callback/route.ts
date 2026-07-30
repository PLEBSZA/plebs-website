import { redirect } from "next/navigation";
import { verifyPaystackPayment, isPaystackConfigured } from "@/lib/commerce/paystack";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference || !isPaystackConfigured()) {
    redirect("/order-confirmation/?error=missing_reference");
  }

  let destination = "/order-confirmation/?error=payment_failed";
  try {
    const result = await verifyPaystackPayment(reference);
    if (result.ok) {
      destination = `/order-confirmation/?order=${encodeURIComponent(result.orderNumber)}&paid=true`;
    }
  } catch {
    // Keep the generic failure destination. Payment details stay server-side.
  }

  redirect(destination);
}
