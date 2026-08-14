import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession, adminCan } from "@/lib/admin/dal";
import { getDashboardInventorySummary } from "@/lib/commerce/inventory-service";
import { listProductsForAdmin } from "@/lib/commerce/catalogue-service";
import { getOrderNextAction } from "@/lib/commerce/order-next-action";
import { listRecentOrdersForAdmin, getAdminOrderViewCounts } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import styles from "./admin-pages.module.css";

export const metadata: Metadata = {
  title: "Admin overview",
};

export default async function AdminOverviewPage() {
  await requireAdminSession();
  const canManageReturns = await adminCan("returns:manage");
  const [inventory, products, orders, counts] = await Promise.all([
    getDashboardInventorySummary(),
    listProductsForAdmin(),
    listRecentOrdersForAdmin(50),
    getAdminOrderViewCounts(),
  ]);

  const actionableOrders = orders.filter((order) => {
    const next = getOrderNextAction(order);
    return (
      next === "Awaiting payment" ||
      next === "Inventory hold" ||
      next === "Ready to pack" ||
      next === "Ready to dispatch" ||
      next === "Confirm delivery" ||
      next === "Complete order" ||
      next === "Process return"
    );
  });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>What needs attention today?</h1>
        <p>
          Operational snapshot for stock, catalogue readiness and upcoming
          fulfilment work.
        </p>
      </header>

      <section className={styles.cards} aria-label="Operational summary">
        <article className={styles.card}>
          <span>Size S available</span>
          <strong>{inventory.sizeSAvailable}</strong>
          <Link href="/admin/inventory">Open inventory</Link>
        </article>
        <article className={styles.card}>
          <span>Low-stock variants</span>
          <strong>{inventory.lowStock.length}</strong>
        </article>
        <article className={styles.card}>
          <span>Out-of-stock variants</span>
          <strong>{inventory.outOfStock.length}</strong>
        </article>
        <article className={styles.card}>
          <span>Orders requiring action</span>
          <strong>{actionableOrders.length}</strong>
          <Link href="/admin/orders?view=open">Review open orders</Link>
        </article>
        {canManageReturns ? (
          <article className={styles.card}>
            <span>Returns to process</span>
            <strong>{counts.returns}</strong>
            <Link href="/admin/orders?view=returns">Open returns</Link>
          </article>
        ) : null}
      </section>

      <section className={styles.panel}>
        <h2>Products</h2>
        {products.length === 0 ? (
          <p className={styles.empty}>No products found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Status</th>
                <th scope="col">Active variants</th>
                <th scope="col">Available stock</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.status}</td>
                  <td>{product.activeVariantCount}</td>
                  <td>{product.totalAvailable}</td>
                  <td>
                    {product.priceMin == null
                      ? "—"
                      : product.priceMin === product.priceMax
                        ? formatMoney(product.priceMin, "ZAR")
                        : `${formatMoney(product.priceMin, "ZAR")} – ${formatMoney(product.priceMax ?? product.priceMin, "ZAR")}`}
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
