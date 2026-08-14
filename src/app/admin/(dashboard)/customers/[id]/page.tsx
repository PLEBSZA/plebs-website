import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/dal";
import { getAdminCustomer } from "@/lib/account/queries";
import {
  adminDeactivateAccountAction,
  adminRecordHistoricConsentAction,
  adminResendSetupAction,
  adminRetrySyncAction,
  adminSuppressCustomerAction,
} from "@/app/admin/actions/customers";
import { formatMoney } from "@/lib/money";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Customer detail",
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdminSession("customers:read");
  const { id } = await params;
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();
  const canManage = actor.role === "OWNER" || actor.role === "OPERATIONS_ADMIN";

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>
          {[customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
            customer.email}
        </h1>
        <p>{customer.email}</p>
      </header>

      <section className={styles.panel}>
        <h2>Account</h2>
        <p>Phone: {customer.phone ?? "—"}</p>
        <p>User: {customer.user?.email ?? "not linked"}</p>
        <p>Role: {customer.user?.role ?? "—"}</p>
        <p>Active: {customer.user?.active ? "yes" : "no"}</p>
        <p>Password: {customer.user?.passwordHash ? "set" : "not set"}</p>
        <p>
          Verified:{" "}
          {customer.user?.emailVerified
            ? customer.user.emailVerified.toISOString()
            : "no"}
        </p>
        <p>
          Last login:{" "}
          {customer.user?.lastLoginAt
            ? customer.user.lastLoginAt.toISOString()
            : "—"}
        </p>
      </section>

      <section className={styles.panel}>
        <h2>Resend</h2>
        <p>Contact ID: {customer.resendContactId ?? "—"}</p>
        <p>Sync: {customer.resendSyncStatus ?? "—"}</p>
        <p>Last sync: {customer.resendSyncedAt?.toISOString() ?? "—"}</p>
        <p>Last error: {customer.resendLastError ?? "—"}</p>
        {canManage ? (
          <form action={adminRetrySyncAction}>
            <input type="hidden" name="customerId" value={customer.id} />
            <button type="submit">Retry Resend sync</button>
          </form>
        ) : null}
      </section>

      <section className={styles.panel}>
        <h2>Preferences</h2>
        <ul>
          {customer.preferences.map((pref) => (
            <li key={pref.id}>
              {pref.purpose} · {pref.status} · {pref.source ?? "—"}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>Consent timeline</h2>
        {customer.consentEvents.length === 0 ? (
          <p>No consent events.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Purpose</th>
                <th>Action</th>
                <th>Source</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {customer.consentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.createdAt.toISOString()}</td>
                  <td>{event.purpose}</td>
                  <td>{event.action}</td>
                  <td>{event.source}</td>
                  <td>{event.wordingVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Orders</h2>
        <ul>
          {customer.orders.map((order) => (
            <li key={order.id}>
              <Link href={`/admin/orders/${order.id}`}>{order.number}</Link> ·{" "}
              {formatMoney(Number(order.total), order.currency)} ·{" "}
              {order.paymentStatus}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>Restock requests</h2>
        <ul>
          {customer.restockRequests.map((request) => (
            <li key={request.id}>
              {request.colour} {request.size} · {request.status}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>Saved addresses</h2>
        <ul>
          {customer.addresses.map((address) => (
            <li key={address.id}>
              {address.line1}, {address.city}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>Outbox</h2>
        <ul>
          {customer.integrationOutbox.map((job) => (
            <li key={job.id}>
              {job.eventType} · {job.status} · attempts {job.attempts}
              {job.lastError ? ` · ${job.lastError}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {canManage ? (
        <>
          <section className={styles.panel}>
            <h2>Suppress marketing</h2>
            <form action={adminSuppressCustomerAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <label>
                Notes
                <input name="notes" />
              </label>
              <button type="submit">Opt out / suppress</button>
            </form>
          </section>
          {customer.user && !customer.user.passwordHash ? (
            <form action={adminResendSetupAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="userId" value={customer.user.id} />
              <button type="submit">Resend setup email</button>
            </form>
          ) : null}
          {customer.user?.active ? (
            <form action={adminDeactivateAccountAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="userId" value={customer.user.id} />
              <button type="submit">Deactivate account</button>
            </form>
          ) : null}
          <section className={styles.panel}>
            <h2>Record historic consent proof</h2>
            <p>This is not an opt-in toggle. Use only with dated evidence.</p>
            <form action={adminRecordHistoricConsentAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <label>
                Source
                <input name="source" required />
              </label>
              <label>
                Date
                <input name="occurredAt" type="date" required />
              </label>
              <label>
                Evidence notes
                <textarea name="evidence" required />
              </label>
              <button type="submit">Record proof</button>
            </form>
          </section>
        </>
      ) : null}
    </>
  );
}
