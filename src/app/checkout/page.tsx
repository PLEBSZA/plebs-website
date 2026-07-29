import { createPageMetadata } from "@/lib/metadata";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = createPageMetadata({
  title: "Checkout",
  description: "Complete your PLEBS dungarees order.",
  path: "/checkout/",
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <section className="section">
      <div className="container">
        <CheckoutForm />
      </div>
    </section>
  );
}
