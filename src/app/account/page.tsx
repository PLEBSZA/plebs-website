import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { getCustomerDashboard } from "@/lib/account/queries";
import { resendSetupAction } from "@/app/account/actions";
import { formatMoney } from "@/lib/money";
import styles from "./account.module.css";

export const metadata = createPageMetadata({
  title: "Your account",
  description: "View your PLEBS orders, profile and email preferences.",
  path: "/account/",
  noIndex: true,
});

export default async function AccountHomePage() {
  const session = await requireCustomerSession();
  const customer = await getCustomerDashboard(session.customerId);
  const latest = customer.orders[0];
  const pendingSetup = !customer.user?.passwordHash;

  return (
    <>
      <header className={styles.header}>
        <h1>Hello{customer.firstName ? `, ${customer.firstName}` : ""}.</h1>
        <p className={styles.lede}>
          {customer.email}
          {pendingSetup
            ? " — a setup link was sent so you can choose a password."
            : " — signed in."}
        </p>
      </header>

      {pendingSetup ? (
        <section className={styles.panel}>
          <h2>Finish setting up your account</h2>
          <p>
            Check your inbox for a secure link. You can request another link if
            the first one expired.
          </p>
          <form action={resendSetupAction}>
            <button type="submit" className={styles.submit}>
              Resend setup email
            </button>
          </form>
        </section>
      ) : null}

      <section className={styles.panel}>
        <h2>Latest order</h2>
        {latest ? (
          <p>
            <Link href={`/account/orders/${latest.number}/`} className={styles.link}>
              {latest.number}
            </Link>{" "}
            · {formatMoney(Number(latest.total), latest.currency)} ·{" "}
            {latest.paymentStatus.replaceAll("_", " ").toLowerCase()} ·{" "}
            {latest.fulfilmentStatus.replaceAll("_", " ").toLowerCase()}
          </p>
        ) : (
          <p>No orders yet.</p>
        )}
        <p>
          <Link href="/account/orders/" className={styles.link}>
            View all orders
          </Link>
        </p>
      </section>
    </>
  );
}
