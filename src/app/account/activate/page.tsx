import { createPageMetadata } from "@/lib/metadata";
import { activateAccountAction } from "@/app/account/actions";
import { PasswordTokenForm } from "../PasswordTokenForm";

export const metadata = createPageMetadata({
  title: "Activate account",
  description: "Set a password for your PLEBS account.",
  path: "/account/activate/",
  noIndex: true,
});

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="container">
        <p>This activation link is missing or incomplete.</p>
      </div>
    );
  }
  return (
    <PasswordTokenForm
      action={activateAccountAction}
      title="Activate your account"
      token={token}
      submitLabel="Set password"
    />
  );
}
