import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/dal";
import { listReturnsForAdmin } from "@/lib/commerce/returns-service";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Returns & exchanges",
};

export default async function AdminReturnsPage() {
  await requireAdminSession("returns:manage");
  const returns = await listReturnsForAdmin();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Returns & exchanges</h1>
        <p>Review and process return requests.</p>
      </header>

      <section className={styles.panel}>
        {returns.length === 0 ? (
          <p className={styles.empty}>No return requests yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Reason</th>
                <th scope="col">Status</th>
                <th scope="col">Exchange</th>
                <th scope="col">Requested</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <Link href={`/admin/returns/${entry.id}`}>
                      {entry.reference}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/admin/orders/${entry.order.id}`}>
                      {entry.order.number}
                    </Link>
                  </td>
                  <td>{entry.order.customerName}</td>
                  <td>{entry.reason}</td>
                  <td>{entry.status.replaceAll("_", " ")}</td>
                  <td>{entry.exchange ? "Yes" : "—"}</td>
                  <td>
                    {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(
                      entry.requestedAt,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
