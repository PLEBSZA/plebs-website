import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { confirmNewsletterAction } from "@/app/account/actions";

export const metadata = createPageMetadata({
  title: "Confirm newsletter",
  description: "Confirm your PLEBS newsletter subscription.",
  path: "/account/confirm-newsletter/",
  noIndex: true,
});

export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await confirmNewsletterAction(token) : { ok: false };

  return (
    <div className="container" style={{ padding: "3rem 0" }}>
      <h1>{result.ok ? "Subscription confirmed" : "Link invalid"}</h1>
      <p>
        {result.ok
          ? "You are subscribed to PLEBS news and product updates. You can change this anytime in your account."
          : "This confirmation link is invalid or has expired."}
      </p>
      <p>
        <Link href="/account/">Go to your account</Link>
      </p>
    </div>
  );
}
