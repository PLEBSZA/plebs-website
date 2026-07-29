import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/dal";
import { listProductionBatches } from "@/lib/commerce/batch-service";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Batches",
};

export default async function AdminBatchesPage() {
  await requireAdminSession("inventory:write");
  const batches = await listProductionBatches();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Production batches</h1>
        <p>
          Track planned and received production lots separately from catalogue
          colours.
        </p>
      </header>
      <p>
        <Link href="/admin/batches/new">Create batch</Link>
      </p>
      <section className={styles.panel}>
        {batches.length === 0 ? (
          <p className={styles.empty}>No batches yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Batch</th>
                <th scope="col">Status</th>
                <th scope="col">Supplier</th>
                <th scope="col">Colour / lot</th>
                <th scope="col">Ordered</th>
                <th scope="col">Accepted</th>
                <th scope="col">Expected</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const ordered = batch.lineItems.reduce(
                  (sum, line) => sum + line.quantityOrdered,
                  0,
                );
                const accepted = batch.lineItems.reduce(
                  (sum, line) => sum + line.quantityAccepted,
                  0,
                );
                return (
                  <tr key={batch.id}>
                    <td>
                      <Link href={`/admin/batches/${batch.id}`}>
                        {batch.batchNumber}
                      </Link>
                    </td>
                    <td>{batch.status}</td>
                    <td>{batch.supplier ?? "—"}</td>
                    <td>{batch.colourOrFabricLot ?? "—"}</td>
                    <td>{ordered}</td>
                    <td>{accepted}</td>
                    <td>
                      {batch.expectedDeliveryDate
                        ? new Intl.DateTimeFormat("en-ZA", {
                            dateStyle: "medium",
                          }).format(batch.expectedDeliveryDate)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
