import { PreferenceStatus } from "@/generated/prisma/client";
import {
  AccountEmptyState,
  AccountPageHeader,
  AccountPanel,
  AccountStatusBadge,
  newsletterBadgeTone,
} from "@/components/account/AccountPrimitives";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import {
  formatAccountDate,
  friendlyNewsletterStatus,
  friendlyRestockStatus,
} from "@/lib/account/account-ui";
import { getCustomerPreferences } from "@/lib/account/queries";
import { createPageMetadata } from "@/lib/metadata";
import { productData } from "@/lib/product";
import { PreferencesForm } from "./PreferencesForm";
import styles from "../account.module.css";

export const metadata = createPageMetadata({
  title: "Email preferences",
  description: "Manage PLEBS newsletter and restock emails.",
  path: "/account/preferences/",
  noIndex: true,
});

export default async function PreferencesPage() {
  const session = await requireCustomerSession();
  const { customer, restockRequests } = await getCustomerPreferences(
    session.customerId,
  );
  const newsletter = customer.preferences.find(
    (entry) => entry.purpose === "NEWSLETTER_EMAIL",
  );
  const status = newsletter?.status ?? null;

  return (
    <>
      <AccountPageHeader title="Email preferences">
        <p>
          Purchases, account creation and restock alerts do not subscribe you to
          the newsletter.
        </p>
      </AccountPageHeader>

      <AccountPanel title="Newsletter">
        <p className={styles.orderBadges}>
          <AccountStatusBadge tone={newsletterBadgeTone(status)}>
            {friendlyNewsletterStatus(status)}
          </AccountStatusBadge>
        </p>
        <p>
          Newsletter emails cover PLEBS news, restocks and product updates. They
          are separate from order confirmations and delivery messages.
        </p>
        {newsletter?.updatedAt ? (
          <p className={styles.formHelp}>
            Last changed {formatAccountDate(newsletter.updatedAt)}.
          </p>
        ) : null}
        <PreferencesForm status={status ?? PreferenceStatus.OPTED_OUT} />
      </AccountPanel>

      <AccountPanel title="Order emails">
        <p>
          Order confirmations, payment updates and delivery messages are
          transactional emails needed to service a purchase. They are not
          newsletter marketing, so they cannot be turned off from this page.
        </p>
      </AccountPanel>

      <AccountPanel title="Restock alerts">
        {restockRequests.length === 0 ? (
          <AccountEmptyState
            title="No restock requests"
            actionHref={productData.path}
            actionLabel="Shop dungarees"
          >
            If a colour or size is unavailable, you can ask to be emailed when
            it is back. That alert is not a newsletter subscription.
          </AccountEmptyState>
        ) : (
          <ul className={styles.restockList}>
            {restockRequests.map((request) => (
              <li key={request.id} className={styles.restockCard}>
                <p className={styles.itemName}>
                  {request.colour} · Size {request.size}
                </p>
                <p>
                  <AccountStatusBadge>
                    {friendlyRestockStatus(request.status)}
                  </AccountStatusBadge>
                </p>
                <p className={styles.orderMeta}>
                  Requested {formatAccountDate(request.createdAt)}
                  {request.notifiedAt
                    ? ` · Notified ${formatAccountDate(request.notifiedAt)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AccountPanel>
    </>
  );
}
