import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { db } from "@/lib/db";
import { ProfileForm } from "./ProfileForm";
import styles from "../account.module.css";

export const metadata = createPageMetadata({
  title: "Profile",
  description: "Update your PLEBS account name and phone.",
  path: "/account/profile/",
  noIndex: true,
});

export default async function ProfilePage() {
  const session = await requireCustomerSession();
  const customer = await db.customer.findUniqueOrThrow({
    where: { id: session.customerId },
  });

  return (
    <>
      <header className={styles.header}>
        <h1>Profile</h1>
        <p className={styles.lede}>Email stays {customer.email} and cannot be changed here.</p>
      </header>
      <ProfileForm
        firstName={customer.firstName ?? ""}
        lastName={customer.lastName ?? ""}
        phone={customer.phone ?? ""}
      />
    </>
  );
}
