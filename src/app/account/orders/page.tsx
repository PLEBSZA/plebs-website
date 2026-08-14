import Link from "next/link";
import {
  AccountEmptyState,
  AccountPageHeader,
  AccountStatusBadge,
  fulfilmentBadgeTone,
  paymentBadgeTone,
} from "@/components/account/AccountPrimitives";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import {
  ACCOUNT_ORDERS_PAGE_SIZE,
  formatAccountDate,
  friendlyFulfilmentStatus,
  friendlyPaymentStatus,
} from "@/lib/account/account-ui";
import { listCustomerOrders } from "@/lib/account/queries";
import { createPageMetadata } from "@/lib/metadata";
import { formatMoney } from "@/lib/money";
import styles from "../account.module.css";

export const metadata = createPageMetadata({
  title: "Your orders",
  description: "Purchase history for your PLEBS account.",
  path: "/account/orders/",
  noIndex: true,
});

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireCustomerSession();
  const { page: pageParam } = await searchParams;
  const { orders, total, page, pageSize } = await listCustomerOrders(
    session.customerId,
    pageParam,
  );
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AccountPageHeader title="Orders">
        <p>Only purchases linked to this account are listed here.</p>
      </AccountPageHeader>

      {total === 0 ? (
        <AccountEmptyState title="No orders yet">
          Your order history will appear here after you buy PLEBS dungarees.
        </AccountEmptyState>
      ) : (
        <>
          <ul className={styles.orderList}>
            {orders.map((order) => (
              <li key={order.id} className={styles.orderCard}>
                <p className={styles.orderNumber}>{order.number}</p>
                <p className={styles.orderMeta}>
                  {formatAccountDate(order.createdAt)} ·{" "}
                  {formatMoney(Number(order.total), order.currency)}
                </p>
                <p className={styles.orderBadges}>
                  <AccountStatusBadge tone={paymentBadgeTone(order.paymentStatus)}>
                    {friendlyPaymentStatus(order.paymentStatus)}
                  </AccountStatusBadge>
                  <AccountStatusBadge tone={fulfilmentBadgeTone(order.fulfilmentStatus)}>
                    {friendlyFulfilmentStatus(order.fulfilmentStatus)}
                  </AccountStatusBadge>
                </p>
                <p>
                  <Link
                    href={`/account/orders/${order.number}/`}
                    className={styles.link}
                  >
                    View order
                  </Link>
                </p>
              </li>
            ))}
          </ul>
          {total > ACCOUNT_ORDERS_PAGE_SIZE ? (
            <nav className={styles.pagination} aria-label="Order pages">
              {page > 1 ? (
                <Link
                  href={page === 2 ? "/account/orders/" : `/account/orders/?page=${page - 1}`}
                  className={styles.secondary}
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <p>
                Page {page} of {pageCount}
              </p>
              {page < pageCount ? (
                <Link
                  href={`/account/orders/?page=${page + 1}`}
                  className={styles.secondary}
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
