import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { isAdminRole } from "@/lib/account/roles";
import { getCustomerSession } from "@/lib/account/customer-dal";
import { auth } from "@/auth";
import { safeInternalCallbackPath } from "@/lib/auth/callback-url";
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
  const params = await searchParams;
  const callbackUrl = safeInternalCallbackPath(params.callbackUrl);
  const authSession = await auth();
  if (isAdminRole(authSession?.user?.role)) {
    redirect("/admin/");
  }
  const session = await getCustomerSession();
  if (session) redirect(callbackUrl);
  const notice = params.activated
    ? "Your account is ready. Sign in with your new password."
    : params.reset
      ? "Password updated. Sign in with your new password."
      : undefined;

  return (
    <CustomerLoginForm callbackUrl={callbackUrl} notice={notice} />
  );
}
