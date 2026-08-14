import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { getCustomerProfile } from "@/lib/account/queries";
import { AccountPageHeader } from "@/components/account/AccountPrimitives";
import { ProfileForm } from "./ProfileForm";

export const metadata = createPageMetadata({
  title: "Profile",
  description: "Update your PLEBS account name and phone.",
  path: "/account/profile/",
  noIndex: true,
});

export default async function ProfilePage() {
  const session = await requireCustomerSession();
  const customer = await getCustomerProfile(session.customerId);

  return (
    <>
      <AccountPageHeader title="Profile">
        <p>Keep your contact details current for deliveries and account emails.</p>
      </AccountPageHeader>
      <ProfileForm
        email={customer.email}
        firstName={customer.firstName ?? ""}
        lastName={customer.lastName ?? ""}
        phone={customer.phone ?? ""}
      />
    </>
  );
}
