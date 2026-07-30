import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/dal";
import {
  canShowExchangeShipmentForm,
  getReturnForAdmin,
} from "@/lib/commerce/returns-service";
import { ExchangeShipmentPanel } from "./ExchangeShipmentPanel";
import { ReturnReceivedEmailButton } from "./ReturnReceivedEmailButton";
import { ReturnStatusForm } from "./ReturnStatusForm";
import styles from "../../admin-pages.module.css";
import { db } from "@/lib/db";

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

  const deliveredAt = entry.order.fulfilments[0]?.deliveredAt ?? null;
  const showExchangeShipment =
    entry.exchange && canShowExchangeShipmentForm(entry.status);
  const returnEmailSends = await db.auditEvent.count({
    where: {
      entityType: "return_request",
      entityId: entry.id,
      action: "return.received_email_sent",
    },
  });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>{entry.reference}</h1>
        <p>
          Status: {entry.status.replaceAll("_", " ")} · Order{" "}
          <Link href={`/admin/orders/${entry.order.id}`}>
            {entry.order.number}
          </Link>
        </p>
        <p style={{ marginTop: "0.25rem" }}>
          <Link href="/admin/orders?view=returns">← All returns</Link>
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Details</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">Reference</th>
              <td>{entry.reference}</td>
            </tr>
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
            {deliveredAt && (
              <tr>
                <th scope="row">Order delivered</th>
                <td>
                  {new Intl.DateTimeFormat("en-ZA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(deliveredAt)}
                </td>
              </tr>
            )}
            {entry.customerComments && (
              <tr>
                <th scope="row">Customer comments</th>
                <td>{entry.customerComments}</td>
              </tr>
            )}
            <tr>
              <th scope="row">Inbound return tracking</th>
              <td>{entry.returnTracking ?? "Not recorded"}</td>
            </tr>
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
            {entry.exchange?.trackingNumber && (
              <tr>
                <th scope="row">Outbound exchange tracking</th>
                <td>
                  {entry.exchange.courier ? `${entry.exchange.courier} · ` : ""}
                  {entry.exchange.trackingUrl ? (
                    <a
                      href={entry.exchange.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {entry.exchange.trackingNumber}
                    </a>
                  ) : (
                    entry.exchange.trackingNumber
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {showExchangeShipment && entry.exchange ? (
        <ExchangeShipmentPanel
          returnId={entry.id}
          exchangeId={entry.exchange.id}
          courier={entry.exchange.courier}
          trackingNumber={entry.exchange.trackingNumber}
          trackingUrl={entry.exchange.trackingUrl}
          dispatchedAt={entry.exchange.dispatchedAt}
          deliveredAt={entry.exchange.deliveredAt}
        />
      ) : null}

      <section className={styles.panel}>
        <h2>Customer email</h2>
        <ReturnReceivedEmailButton
          returnId={entry.id}
          hasReceivedAt={Boolean(entry.receivedAt)}
          priorSendCount={returnEmailSends}
        />
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
