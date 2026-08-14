import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/dal";
import { listAdminCustomers } from "@/lib/account/queries";
import { formatMoney } from "@/lib/money";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminSession("customers:read");
  const params = await searchParams;
  const search = params.q?.trim();
  const page = Math.max(1, Number(params.page || "1") || 1);
  const take = 50;
  const listing = await listAdminCustomers({
    search,
    skip: (page - 1) * take,
    take,
  });
  const pages = Math.max(1, Math.ceil(listing.total / take));

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Customers</h1>
        <p>Account, consent and Resend sync state. Opt-in cannot be toggled on here.</p>
      </header>
      <form className={styles.toolbar} method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search email, name or order number"
        />
        <button type="submit">Search</button>
      </form>
      {listing.customers.length === 0 ? (
        <p className={styles.empty}>No customers match.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Account</th>
              <th scope="col">Paid orders</th>
              <th scope="col">Lifetime</th>
              <th scope="col">Last order</th>
              <th scope="col">Newsletter</th>
              <th scope="col">Resend</th>
            </tr>
          </thead>
          <tbody>
            {listing.customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <Link href={`/admin/customers/${customer.id}`}>
                    {[customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
                      customer.email}
                  </Link>
                  <div>{customer.email}</div>
                </td>
                <td>{customer.accountStatus.replaceAll("_", " ")}</td>
                <td>{customer.paidOrderCount}</td>
                <td>{formatMoney(customer.lifetimePaidTotal, "ZAR")}</td>
                <td>
                  {customer.lastOrderAt
                    ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(
                        customer.lastOrderAt,
                      )
                    : "—"}
                </td>
                <td>{customer.newsletterStatus.replaceAll("_", " ").toLowerCase()}</td>
                <td>{customer.resendSyncStatus ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pages > 1 ? (
        <p>
          Page {page} of {pages}
          {page < pages ? (
            <>
              {" "}
              ·{" "}
              <Link href={`/admin/customers?page=${page + 1}${search ? `&q=${search}` : ""}`}>
                Next
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
