import { createPageMetadata } from "@/lib/metadata";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getPaystackMode } from "@/lib/commerce/paystack";

export const metadata = createPageMetadata({
  title: "Checkout",
  description: "Complete your PLEBS dungarees order.",
  path: "/checkout/",
  noIndex: true,
});

export default function CheckoutPage() {
  const paymentMode = getPaystackMode();

  return (
    <section className="section">
      <div className="container">
        <CheckoutForm paymentMode={paymentMode} />
      </div>
    </section>
  );
}
