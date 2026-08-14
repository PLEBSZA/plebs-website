import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { listCustomerOrders } from "@/lib/account/queries";
import { formatMoney } from "@/lib/money";
import styles from "../account.module.css";

export const metadata = createPageMetadata({
  title: "Your orders",
  description: "Purchase history for your PLEBS account.",
  path: "/account/orders/",
  noIndex: true,
});

export default async function AccountOrdersPage() {
  const session = await requireCustomerSession();
  const orders = await listCustomerOrders(session.customerId);

  return (
    <>
      <header className={styles.header}>
        <h1>Orders</h1>
        <p className={styles.lede}>Only your purchases are listed here.</p>
      </header>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Date</th>
              <th scope="col">Total</th>
              <th scope="col">Payment</th>
              <th scope="col">Fulfilment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/account/orders/${order.number}/`} className={styles.link}>
                    {order.number}
                  </Link>
                </td>
                <td>
                  {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(
                    order.createdAt,
                  )}
                </td>
                <td>{formatMoney(Number(order.total), order.currency)}</td>
                <td>{order.paymentStatus.replaceAll("_", " ").toLowerCase()}</td>
                <td>{order.fulfilmentStatus.replaceAll("_", " ").toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
