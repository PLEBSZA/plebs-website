import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { listCustomerAddresses } from "@/lib/account/queries";
import { AddressManager } from "./AddressManager";
import styles from "../account.module.css";

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
      <header className={styles.header}>
        <h1>Addresses</h1>
        <p className={styles.lede}>
          Saved addresses are for convenience. Order snapshots stay unchanged.
        </p>
      </header>
      <AddressManager addresses={addresses} />
    </>
  );
}
