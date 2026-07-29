import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/dal";
import { listOrdersForAdmin } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage() {
  await requireAdminSession("orders:read");
  const orders = await listOrdersForAdmin({ take: 100 });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Orders</h1>
        <p>
          Durable order records with separate payment and fulfilment states.
          Payment capture remains pending gateway connection.
        </p>
      </header>
      <section className={styles.panel}>
        {orders.length === 0 ? (
          <p className={styles.empty}>No orders yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date</th>
                <th scope="col">Customer</th>
                <th scope="col">Payment</th>
                <th scope="col">Fulfilment</th>
                <th scope="col">Item</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const item = order.items[0];
                return (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`}>{order.number}</Link>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("en-ZA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(order.createdAt)}
                    </td>
                    <td>
                      {order.customerName}
                      <br />
                      {order.customerEmail}
                    </td>
                    <td>{order.paymentStatus}</td>
                    <td>{order.fulfilmentStatus}</td>
                    <td>
                      {item
                        ? `${item.colour} / ${item.size} × ${item.quantity}`
                        : "—"}
                    </td>
                    <td>{formatMoney(Number(order.total), "ZAR")}</td>
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
