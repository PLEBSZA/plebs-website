import { PreferenceStatus } from "@/generated/prisma/client";
import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { getCustomerPreferences } from "@/lib/account/queries";
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
  const { customer, restockRequests, consentEvents } =
    await getCustomerPreferences(session.customerId);
  const newsletter = customer.preferences.find(
    (entry) => entry.purpose === "NEWSLETTER_EMAIL",
  );
  const optedIn = newsletter?.status === PreferenceStatus.OPTED_IN;
  const latestConsent = consentEvents[0];

  return (
    <>
      <header className={styles.header}>
        <h1>Email preferences</h1>
        <p className={styles.lede}>
          Purchases and restock alerts are not a newsletter subscription.
        </p>
      </header>
      <PreferencesForm optedIn={optedIn} />
      {latestConsent ? (
        <p>
          Last newsletter consent change: {latestConsent.action.toLowerCase()} from{" "}
          {latestConsent.source} on{" "}
          {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(
            latestConsent.createdAt,
          )}
          .
        </p>
      ) : null}
      <section className={styles.panel}>
        <h2>Restock requests</h2>
        {restockRequests.length === 0 ? (
          <p>No restock alerts on file.</p>
        ) : (
          <ul>
            {restockRequests.map((request) => (
              <li key={request.id}>
                {request.colour}, size {request.size} · {request.status.toLowerCase()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
