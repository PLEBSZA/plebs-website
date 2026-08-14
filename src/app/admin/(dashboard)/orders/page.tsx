import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession, adminCan } from "@/lib/admin/dal";
import { getOrderNextAction } from "@/lib/commerce/order-next-action";
import {
  getAdminOrderViewCounts,
  listOrdersForAdmin,
  type AdminOrderView,
} from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Orders",
};

function parseView(value: string | undefined): AdminOrderView {
  if (value === "completed" || value === "returns" || value === "cancelled") {
    return value;
  }
  return "open";
}

function buildOrdersHref(input: {
  view: AdminOrderView;
  search?: string;
  includeClosed?: boolean;
}) {
  const query = new URLSearchParams();
  if (input.view !== "open") query.set("view", input.view);
  if (input.search) query.set("q", input.search);
  if (input.view === "returns" && input.includeClosed) {
    query.set("includeClosed", "1");
  }
  const qs = query.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    q?: string;
    includeClosed?: string;
  }>;
}) {
  await requireAdminSession("orders:read");
  const params = await searchParams;
  const view = parseView(params.view);
  const search = params.q?.trim() || undefined;
  const includeTerminalReturns = params.includeClosed === "1";
  const canManageReturns = await adminCan("returns:manage");

  if (view === "returns" && !canManageReturns) {
    redirect("/admin/orders?view=open");
  }

  const [counts, listing] = await Promise.all([
    getAdminOrderViewCounts(search),
    listOrdersForAdmin({
      view,
      search,
      take: 100,
      includeTerminalReturns,
    }),
  ]);

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Orders</h1>
        <p>
          Open work, completed deliveries, and returns — three views over the
          same order records.
        </p>
      </header>

      <nav className={styles.tabs} aria-label="Order views">
        <Link
          href={buildOrdersHref({ view: "open", search })}
          className={view === "open" ? styles.tabActive : styles.tab}
        >
          Open <span className={styles.tabCount}>({counts.open})</span>
        </Link>
        <Link
          href={buildOrdersHref({ view: "completed", search })}
          className={view === "completed" ? styles.tabActive : styles.tab}
        >
          Completed{" "}
          <span className={styles.tabCount}>({counts.completed})</span>
        </Link>
        {canManageReturns ? (
          <Link
            href={buildOrdersHref({
              view: "returns",
              search,
              includeClosed: includeTerminalReturns,
            })}
            className={view === "returns" ? styles.tabActive : styles.tab}
          >
            Returns & exchanges{" "}
            <span className={styles.tabCount}>({counts.returns})</span>
          </Link>
        ) : null}
      </nav>

      <form className={styles.toolbar} method="get">
        {view !== "open" ? (
          <input type="hidden" name="view" value={view} />
        ) : null}
        {view === "returns" && includeTerminalReturns ? (
          <input type="hidden" name="includeClosed" value="1" />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search order #, customer, tracking, RMA…"
          aria-label="Search orders"
        />
        <button type="submit">Search</button>
        {search ? (
          <Link href={buildOrdersHref({ view, includeClosed: includeTerminalReturns })}>
            Clear
          </Link>
        ) : null}
        {view !== "cancelled" && counts.cancelled > 0 ? (
          <Link href={buildOrdersHref({ view: "cancelled", search })}>
            Cancelled ({counts.cancelled})
          </Link>
        ) : null}
      </form>

      <section className={styles.panel}>
        {view === "returns" && listing.kind === "returns" ? (
          listing.rows.length === 0 ? (
            <p className={styles.empty}>No return requests in this view.</p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                <Link
                  href={buildOrdersHref({
                    view: "returns",
                    search,
                    includeClosed: !includeTerminalReturns,
                  })}
                >
                  {includeTerminalReturns
                    ? "Hide closed returns"
                    : "Show closed returns"}
                </Link>
              </p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Return reference</th>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Return status</th>
                    <th scope="col">Exchange</th>
                    <th scope="col">Requested</th>
                    <th scope="col">Inbound tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {listing.rows.map((entry) => (
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
                      <td>
                        {entry.status.replaceAll("_", " ")}
                        <span className={styles.badge} aria-hidden="true">
                          {entry.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{entry.exchange ? "Yes" : "No"}</td>
                      <td>
                        {new Intl.DateTimeFormat("en-ZA", {
                          dateStyle: "medium",
                        }).format(entry.requestedAt)}
                      </td>
                      <td>{entry.returnTracking ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        ) : listing.kind === "orders" && listing.rows.length === 0 ? (
          <p className={styles.empty}>No orders in this view.</p>
        ) : listing.kind === "orders" && view === "completed" ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date placed</th>
                <th scope="col">Delivered</th>
                <th scope="col">Customer</th>
                <th scope="col">Item</th>
                <th scope="col">Total</th>
                <th scope="col">Returns</th>
              </tr>
            </thead>
            <tbody>
              {listing.rows.map((order) => {
                const item = order.items[0];
                const deliveredAt = order.fulfilments[0]?.deliveredAt;
                return (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`}>
                        {order.number}
                      </Link>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("en-ZA", {
                        dateStyle: "medium",
                      }).format(order.createdAt)}
                    </td>
                    <td>
                      {deliveredAt
                        ? new Intl.DateTimeFormat("en-ZA", {
                            dateStyle: "medium",
                          }).format(deliveredAt)
                        : "—"}
                    </td>
                    <td>{order.customerName}</td>
                    <td>
                      {item
                        ? `${item.colour} / ${item.size} × ${item.quantity}`
                        : "—"}
                    </td>
                    <td>{formatMoney(Number(order.total), "ZAR")}</td>
                    <td>
                      {order.returnRequests.length > 0
                        ? String(order.returnRequests.length)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : listing.kind === "orders" ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date placed</th>
                <th scope="col">Customer</th>
                <th scope="col">Payment</th>
                <th scope="col">Fulfilment</th>
                <th scope="col">Item</th>
                <th scope="col">Total</th>
                <th scope="col">Next action</th>
              </tr>
            </thead>
            <tbody>
              {listing.rows.map((order) => {
                const item = order.items[0];
                const next = getOrderNextAction(order);
                return (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`}>
                        {order.number}
                      </Link>
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
                    <td>
                      {order.paymentStatus.replaceAll("_", " ")}
                      <span className={styles.badge} aria-hidden="true">
                        {order.paymentStatus.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {order.fulfilmentStatus.replaceAll("_", " ")}
                      <span className={styles.badge} aria-hidden="true">
                        {order.fulfilmentStatus.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {item
                        ? `${item.colour} / ${item.size} × ${item.quantity}`
                        : "—"}
                    </td>
                    <td>{formatMoney(Number(order.total), "ZAR")}</td>
                    <td>
                      {next === "None" ? "—" : next}
                      {order.inventoryHold ? (
                        <span className={styles.badge}>Hold</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </section>
    </>
  );
}
