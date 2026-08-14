import { createPageMetadata } from "@/lib/metadata";
import { resetPasswordAction } from "@/app/account/actions";
import { PasswordTokenForm } from "../PasswordTokenForm";

export const metadata = createPageMetadata({
  title: "Reset password",
  description: "Choose a new PLEBS account password.",
  path: "/account/reset-password/",
  noIndex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="container">
        <p>This reset link is missing or incomplete.</p>
      </div>
    );
  }
  return (
    <PasswordTokenForm
      action={resetPasswordAction}
      title="Reset your password"
      token={token}
      submitLabel="Update password"
    />
  );
}
