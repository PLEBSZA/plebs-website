import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/dal";
import { getReturnForAdmin } from "@/lib/commerce/returns-service";
import { ReturnStatusForm } from "./ReturnStatusForm";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Return detail",
};

export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession("returns:manage");
  const { id } = await params;
  const entry = await getReturnForAdmin(id);

  if (!entry) notFound();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Return {entry.id.slice(0, 8)}…</h1>
        <p>
          Status: {entry.status.replaceAll("_", " ")} · Order{" "}
          <Link href={`/admin/orders/${entry.order.id}`}>
            {entry.order.number}
          </Link>
        </p>
        <p style={{ marginTop: "0.25rem" }}>
          <Link href="/admin/returns">← All returns</Link>
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Details</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">Item</th>
              <td>
                {entry.orderItem.sku} – {entry.orderItem.colour}{" "}
                {entry.orderItem.size} (×{entry.orderItem.quantity})
              </td>
            </tr>
            <tr>
              <th scope="row">Reason</th>
              <td>{entry.reason}</td>
            </tr>
            {entry.customerComments && (
              <tr>
                <th scope="row">Customer comments</th>
                <td>{entry.customerComments}</td>
              </tr>
            )}
            {entry.returnTracking && (
              <tr>
                <th scope="row">Return tracking</th>
                <td>{entry.returnTracking}</td>
              </tr>
            )}
            {entry.disposition && (
              <tr>
                <th scope="row">Disposition</th>
                <td>{entry.disposition.replaceAll("_", " ")}</td>
              </tr>
            )}
            {entry.inspectionOutcome && (
              <tr>
                <th scope="row">Inspection</th>
                <td>{entry.inspectionOutcome}</td>
              </tr>
            )}
            {entry.exchange && (
              <tr>
                <th scope="row">Exchange</th>
                <td>
                  Replacement:{" "}
                  {entry.exchange.replacementVariant.colourValue.label}{" "}
                  {entry.exchange.replacementVariant.sizeValue.label} ·
                  Status: {entry.exchange.status.replaceAll("_", " ")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <h2>Update status</h2>
        <ReturnStatusForm
          returnId={entry.id}
          currentStatus={entry.status}
        />
      </section>
    </>
  );
}
