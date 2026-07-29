import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiveBatchForm } from "@/app/admin/(dashboard)/batches/ReceiveBatchForm";
import { requireAdminSession } from "@/lib/admin/dal";
import { getProductionBatch } from "@/lib/commerce/batch-service";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Batch detail",
};

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession("inventory:write");
  const { id } = await params;
  const batch = await getProductionBatch(id);
  if (!batch) notFound();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>{batch.batchNumber}</h1>
        <p>
          Status {batch.status.replaceAll("_", " ")} · QC{" "}
          {batch.qualityControlStatus.replaceAll("_", " ")}
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Batch summary</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">Supplier</th>
              <td>{batch.supplier ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Manufacturer</th>
              <td>{batch.manufacturer ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Colour / lot</th>
              <td>{batch.colourOrFabricLot ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Expected</th>
              <td>
                {batch.expectedDeliveryDate
                  ? new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                    }).format(batch.expectedDeliveryDate)
                  : "—"}
              </td>
            </tr>
            <tr>
              <th scope="row">Notes</th>
              <td>{batch.notes ?? "—"}</td>
            </tr>
          </tbody>
        </table>
        <p>
          <Link href="/admin/batches">Back to batches</Link>
        </p>
      </section>

      <ReceiveBatchForm
        batchId={batch.id}
        lines={batch.lineItems.map((line) => ({
          id: line.id,
          sizeLabel: line.variant.sizeValue.label,
          sku: line.variant.sku,
          quantityOrdered: line.quantityOrdered,
          quantityReceived: line.quantityReceived,
          quantityRejected: line.quantityRejected,
          quantityAccepted: line.quantityAccepted,
        }))}
      />
    </>
  );
}
