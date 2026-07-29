import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin/dal";
import { getRestockDemandSummary, listRestockRequests } from "@/lib/restock";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Restock demand",
};

export default async function AdminRestockPage() {
  await requireAdminSession("restock:read");
  const [summary, requests] = await Promise.all([
    getRestockDemandSummary(),
    listRestockRequests(),
  ]);

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Restock demand</h1>
        <p>
          Active waitlist demand by colour and size. Restock consent is separate
          from marketing consent.
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Summary</h2>
        {summary.length === 0 ? (
          <p className={styles.empty}>No active restock requests.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Colour</th>
                <th scope="col">Size</th>
                <th scope="col">Active requests</th>
                <th scope="col">Unique customers</th>
                <th scope="col">Oldest request</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={`${row.colour}-${row.size}`}>
                  <td>{row.colour}</td>
                  <td>{row.size}</td>
                  <td>{row.activeRequests}</td>
                  <td>{row.uniqueCustomers}</td>
                  <td>
                    {new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                    }).format(row.oldestRequest)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Recent requests</h2>
        {requests.length === 0 ? (
          <p className={styles.empty}>No restock requests saved yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Email</th>
                <th scope="col">Colour</th>
                <th scope="col">Size</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 100).map((request) => (
                <tr key={request.id}>
                  <td>
                    {new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(request.createdAt)}
                  </td>
                  <td>{request.email}</td>
                  <td>{request.colour}</td>
                  <td>{request.size}</td>
                  <td>{request.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
