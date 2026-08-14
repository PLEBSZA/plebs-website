import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { getCustomerSession } from "@/lib/account/customer-dal";
import { CustomerLoginForm } from "../CustomerLoginForm";

export const metadata = createPageMetadata({
  title: "Account sign in",
  description: "Sign in to your PLEBS account.",
  path: "/account/login/",
  noIndex: true,
});

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; activated?: string; reset?: string }>;
}) {
  const session = await getCustomerSession();
  if (session) redirect("/account/");
  const params = await searchParams;
  const notice = params.activated
    ? "Your account is ready. Sign in with your new password."
    : params.reset
      ? "Password updated. Sign in with your new password."
      : undefined;

  return (
    <CustomerLoginForm callbackUrl={params.callbackUrl} notice={notice} />
  );
}
