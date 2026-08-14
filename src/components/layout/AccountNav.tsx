import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/account/customer-dal";
import { accountMenuIdentity } from "@/lib/account/policy";
import { AccountMenu, AccountMenuFallback } from "./AccountMenu";

export async function AccountNav() {
  const session = await auth();
  const customer = session?.user?.id ? await getCustomerSession() : null;
  const signedIn = Boolean(customer || session?.user);

  if (!signedIn) {
    return <AccountMenu signedIn={false} homeHref="/account/" />;
  }

  const identity = accountMenuIdentity({
    firstName: customer?.firstName,
    lastName: customer?.lastName,
    name: customer?.name ?? session?.user?.name,
    email: customer?.email ?? session?.user?.email,
  });

  return (
    <AccountMenu
      signedIn
      homeHref={customer ? "/account/" : "/admin/"}
      initials={identity.initials}
      menuLabel={identity.menuLabel}
      isAdmin={!customer}
    />
  );
}

export function AccountNavFallback() {
  return <AccountMenuFallback />;
}
