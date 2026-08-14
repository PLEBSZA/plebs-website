import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { getCustomerSession } from "@/lib/account/customer-dal";
import { RegisterForm } from "./RegisterForm";

export const metadata = createPageMetadata({
  title: "Create account",
  description: "Create a PLEBS customer account.",
  path: "/account/register/",
  noIndex: true,
});

export default async function AccountRegisterPage() {
  const session = await getCustomerSession();
  if (session) redirect("/account/");
  return <RegisterForm />;
}
