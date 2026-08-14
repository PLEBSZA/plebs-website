import { createPageMetadata } from "@/lib/metadata";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = createPageMetadata({
  title: "Forgot password",
  description: "Reset your PLEBS account password.",
  path: "/account/forgot-password/",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
