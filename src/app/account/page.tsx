import Link from "next/link";
import { resendSetupAction } from "@/app/account/actions";
import {
  AccountDetailsList,
  AccountEmptyState,
  AccountPageHeader,
  AccountPanel,
  AccountStatusBadge,
  fulfilmentBadgeTone,
  newsletterBadgeTone,
  paymentBadgeTone,
} from "@/components/account/AccountPrimitives";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import {
  formatAccountDate,
  friendlyFulfilmentStatus,
  friendlyNewsletterStatus,
  friendlyPaymentStatus,
} from "@/lib/account/account-ui";
import { getCustomerDashboard } from "@/lib/account/queries";
import { createPageMetadata } from "@/lib/metadata";
import { formatMoney } from "@/lib/money";
import styles from "./account.module.css";

export const metadata = createPageMetadata({
  title: "Your account",
  description: "View your PLEBS orders, profile and email preferences.",
  path: "/account/",
  noIndex: true,
});

function missing(value: string | null | undefined) {
  return value?.trim() ? value : "Not provided";
}

export default async function AccountHomePage() {
  const session = await requireCustomerSession();
  const dashboard = await getCustomerDashboard(session.customerId);
  const latest = dashboard.latestOrder;
  const pendingSetup = !dashboard.hasPassword;
  const profileComplete = Boolean(
    dashboard.firstName?.trim() &&
      dashboard.lastName?.trim() &&
      dashboard.phone?.trim(),
  );
  const accountStatus = pendingSetup
    ? "Setup email sent"
    : dashboard.emailVerified
      ? "Verified"
      : "Active";
  const displayName = dashboard.firstName?.trim();

  return (
    <>
      <AccountPageHeader title={displayName ? `Welcome back, ${displayName}` : "My account"}>
        <p>{dashboard.email}</p>
      </AccountPageHeader>

      {pendingSetup ? (
        <AccountPanel title="Finish setting up your account">
          <p>
            This account does not have a password yet. Check your inbox for a
            secure setup link, or request another if the first one expired.
          </p>
          <form action={resendSetupAction} className={styles.formActions}>
            <button type="submit" className={styles.submit}>
              Resend setup email
            </button>
          </form>
        </AccountPanel>
      ) : null}

      <div className={styles.summaryGrid}>
        <section className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Orders</p>
          <p className={styles.summaryValue}>{dashboard.orderCount}</p>
        </section>
        <section className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Saved addresses</p>
          <p className={styles.summaryValue}>{dashboard.addressCount}</p>
        </section>
        <section className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Newsletter</p>
          <p className={styles.summaryValue}>
            <AccountStatusBadge tone={newsletterBadgeTone(dashboard.newsletterStatus)}>
              {friendlyNewsletterStatus(dashboard.newsletterStatus)}
            </AccountStatusBadge>
          </p>
        </section>
        <section className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Account</p>
          <p className={styles.summaryValue}>{accountStatus}</p>
          <p className={styles.summaryHint}>
            {profileComplete ? "Profile complete" : "Profile incomplete"}
          </p>
        </section>
      </div>

      {latest ? (
        <AccountPanel title="Latest order">
          <div className={styles.orderCard}>
            <p className={styles.orderNumber}>
              <Link href={`/account/orders/${latest.number}/`} className={styles.link}>
                {latest.number}
              </Link>
            </p>
            <p className={styles.orderMeta}>
              {formatAccountDate(latest.createdAt)} ·{" "}
              {formatMoney(Number(latest.total), latest.currency)}
            </p>
            <p className={styles.orderBadges}>
              <AccountStatusBadge tone={paymentBadgeTone(latest.paymentStatus)}>
                {friendlyPaymentStatus(latest.paymentStatus)}
              </AccountStatusBadge>
              <AccountStatusBadge tone={fulfilmentBadgeTone(latest.fulfilmentStatus)}>
                {friendlyFulfilmentStatus(latest.fulfilmentStatus)}
              </AccountStatusBadge>
            </p>
            <p>
              <Link href={`/account/orders/${latest.number}/`} className={styles.link}>
                View order
              </Link>
              {" · "}
              <Link href="/account/orders/" className={styles.link}>
                All orders
              </Link>
            </p>
          </div>
        </AccountPanel>
      ) : (
        <AccountEmptyState title="No orders yet">
          When you buy PLEBS dungarees, your latest order will appear here.
        </AccountEmptyState>
      )}

      <AccountPanel title="Account details">
        <AccountDetailsList
          items={[
            {
              term: "Name",
              value: missing(
                [dashboard.firstName, dashboard.lastName].filter(Boolean).join(" "),
              ),
              href: "/account/profile/",
              hrefLabel: "Edit profile",
            },
            {
              term: "Email",
              value: dashboard.email,
            },
            {
              term: "Phone",
              value: missing(dashboard.phone),
              href: "/account/profile/",
              hrefLabel: "Add phone",
            },
            {
              term: "Saved addresses",
              value: String(dashboard.addressCount),
              href: "/account/addresses/",
              hrefLabel: dashboard.addressCount ? "Manage" : "Add an address",
            },
          ]}
        />
      </AccountPanel>
    </>
  );
}
