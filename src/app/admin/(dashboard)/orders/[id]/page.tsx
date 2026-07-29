import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/dal";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { OrderActionsPanel } from "./OrderActionsPanel";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Order detail",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminSession("orders:read");
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: true,
      fulfilments: true,
      returnRequests: { include: { exchange: true } },
    },
  });

  if (!order) notFound();

  const shipping = order.shippingAddress as {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };

  const latestFulfilment = order.fulfilments[0];

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>{order.number}</h1>
        <p>
          Payment {order.paymentStatus.replaceAll("_", " ").toLowerCase()} ·
          Fulfilment{" "}
          {order.fulfilmentStatus.replaceAll("_", " ").toLowerCase()} ·
          Lifecycle {order.status.toLowerCase()}
        </p>
        <p style={{ marginTop: "0.25rem" }}>
          <Link href="/admin/orders">← All orders</Link>
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Customer</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">Name</th>
              <td>{order.customerName}</td>
            </tr>
            <tr>
              <th scope="row">Email</th>
              <td>{order.customerEmail}</td>
            </tr>
            <tr>
              <th scope="row">Phone</th>
              <td>{order.customerPhone ?? "—"}</td>
            </tr>
            <tr>
              <th scope="row">Shipping</th>
              <td>
                {shipping.line1}
                {shipping.line2 ? `, ${shipping.line2}` : ""}
                <br />
                {shipping.city}, {shipping.province} {shipping.postalCode}
                <br />
                {shipping.country}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <h2>Items</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">SKU</th>
              <th scope="col">Colour</th>
              <th scope="col">Size</th>
              <th scope="col">Qty</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.sku}</td>
                <td>{item.colour}</td>
                <td>{item.size}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(Number(item.lineTotal), "ZAR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <h2>Payment</h2>
        {order.payments.length === 0 ? (
          <p className={styles.empty}>No payment records.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Provider</th>
                <th scope="col">Status</th>
                <th scope="col">Reference</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.provider}</td>
                  <td>{payment.status}</td>
                  <td>{payment.providerReference ?? "—"}</td>
                  <td>{formatMoney(Number(payment.amount), "ZAR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {latestFulfilment?.courier && (
        <section className={styles.panel}>
          <h2>Fulfilment & tracking</h2>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">Status</th>
                <td>{latestFulfilment.status.replaceAll("_", " ")}</td>
              </tr>
              <tr>
                <th scope="row">Courier</th>
                <td>{latestFulfilment.courier ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">Tracking #</th>
                <td>
                  {latestFulfilment.trackingUrl ? (
                    <a
                      href={latestFulfilment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {latestFulfilment.trackingNumber}
                    </a>
                  ) : (
                    latestFulfilment.trackingNumber ?? "—"
                  )}
                </td>
              </tr>
              {latestFulfilment.packedAt && (
                <tr>
                  <th scope="row">Packed</th>
                  <td>
                    {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(latestFulfilment.packedAt)}
                  </td>
                </tr>
              )}
              {latestFulfilment.dispatchedAt && (
                <tr>
                  <th scope="row">Dispatched</th>
                  <td>
                    {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(latestFulfilment.dispatchedAt)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {order.returnRequests.length > 0 && (
        <section className={styles.panel}>
          <h2>Returns / exchanges</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Reason</th>
                <th scope="col">Status</th>
                <th scope="col">Exchange</th>
              </tr>
            </thead>
            <tbody>
              {order.returnRequests.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <Link href={`/admin/returns/${entry.id}`}>
                      {entry.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td>{entry.reason}</td>
                  <td>{entry.status.replaceAll("_", " ")}</td>
                  <td>{entry.exchange ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <OrderActionsPanel
        orderId={order.id}
        status={order.status}
        paymentStatus={order.paymentStatus}
        fulfilmentStatus={order.fulfilmentStatus}
        items={order.items.map((item) => ({
          id: item.id,
          sku: item.sku,
          colour: item.colour,
          size: item.size,
        }))}
      />
    </>
  );
}
