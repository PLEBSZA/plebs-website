import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { CheckoutForm, type CheckoutPrefill } from "@/components/checkout/CheckoutForm";
import { CheckoutPrefillBeacon } from "@/components/checkout/CheckoutPrefillBeacon";
import { getCustomerSession } from "@/lib/account/customer-dal";
import { listCustomerAddresses } from "@/lib/account/queries";
import { SOUTH_AFRICAN_PROVINCES } from "@/lib/checkout/provinces";
import { getPaystackMode } from "@/lib/commerce/paystack";

export const metadata = createPageMetadata({
  title: "Checkout",
  description: "Complete your PLEBS dungarees order.",
  path: "/checkout/",
  noIndex: true,
});

function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

async function CheckoutAccountPrefill() {
  const session = await getCustomerSession();
  if (!session) {
    return <CheckoutPrefillBeacon prefill={{ signedIn: false }} />;
  }

  const addresses = await listCustomerAddresses(session.customerId);
  const address = addresses[0];
  const names = splitName(session.name);
  const province = address?.province;
  const prefill: CheckoutPrefill = {
    signedIn: true,
    email: session.email,
    firstName: names.firstName,
    lastName: names.lastName,
    shippingLine1: address?.line1,
    shippingLine2: address?.line2 ?? undefined,
    shippingCity: address?.city,
    shippingProvince:
      province &&
      (SOUTH_AFRICAN_PROVINCES as readonly string[]).includes(province)
        ? province
        : undefined,
    shippingPostalCode: address?.postalCode,
  };

  return <CheckoutPrefillBeacon prefill={prefill} />;
}

export default function CheckoutPage() {
  const paymentMode = getPaystackMode();

  return (
    <section className="section">
      <div className="container">
        <CheckoutForm paymentMode={paymentMode} />
        <Suspense fallback={null}>
          <CheckoutAccountPrefill />
        </Suspense>
      </div>
    </section>
  );
}
