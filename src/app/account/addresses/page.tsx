import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { listCustomerAddresses } from "@/lib/account/queries";
import { AccountPageHeader } from "@/components/account/AccountPrimitives";
import { AddressManager } from "./AddressManager";

export const metadata = createPageMetadata({
  title: "Addresses",
  description: "Saved PLEBS delivery addresses.",
  path: "/account/addresses/",
  noIndex: true,
});

export default async function AddressesPage() {
  const session = await requireCustomerSession();
  const addresses = await listCustomerAddresses(session.customerId);

  return (
    <>
      <AccountPageHeader title="Addresses">
        <p>
          Saved addresses are for convenience. Changing them never rewrites a
          past order snapshot.
        </p>
      </AccountPageHeader>
      <AddressManager addresses={addresses} />
    </>
  );
}
