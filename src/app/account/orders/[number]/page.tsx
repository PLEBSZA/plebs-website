import Link from "next/link";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import { getCustomerOrder } from "@/lib/account/queries";
import { formatMoney } from "@/lib/money";
import { getContactEmail } from "@/lib/email/resend";
import styles from "../../account.module.css";

export const metadata = createPageMetadata({
  title: "Order detail",
  description: "Your PLEBS order details and tracking.",
  path: "/account/orders/",
  noIndex: true,
});

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const session = await requireCustomerSession();
  const { number } = await params;
  const order = await getCustomerOrder(session.customerId, number);
  if (!order) notFound();

  const shipping = order.shippingAddress as {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  const payment = order.payments[0];
  const fulfilment = order.fulfilments[0];

  return (
    <>
      <header className={styles.header}>
        <h1>{order.number}</h1>
        <p className={styles.lede}>
          Placed{" "}
          {new Intl.DateTimeFormat("en-ZA", {
            dateStyle: "medium",
          }).format(order.createdAt)}{" "}
          · {formatMoney(Number(order.total), order.currency)}
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Item</h2>
        {order.items.map((item) => (
          <p key={item.id}>
            {item.productName} · {item.colour} · size {item.size} · qty{" "}
            {item.quantity}
          </p>
        ))}
      </section>

      <section className={styles.panel}>
        <h2>Payment</h2>
        <p>
          {order.paymentStatus.replaceAll("_", " ").toLowerCase()}
          {payment?.provider ? ` · ${payment.provider}` : ""}
        </p>
      </section>

      <section className={styles.panel}>
        <h2>Delivery snapshot</h2>
        <p>
          {shipping.line1}
          {shipping.line2 ? `, ${shipping.line2}` : ""}
          <br />
          {shipping.city}, {shipping.province} {shipping.postalCode}
          <br />
          {shipping.country}
        </p>
      </section>

      <section className={styles.panel}>
        <h2>Fulfilment and tracking</h2>
        <p>Status: {order.fulfilmentStatus.replaceAll("_", " ").toLowerCase()}</p>
        {fulfilment?.trackingNumber ? (
          <p>
            {fulfilment.courier ?? "Courier"} · {fulfilment.trackingNumber}
            {fulfilment.trackingUrl ? (
              <>
                {" "}
                ·{" "}
                <a href={fulfilment.trackingUrl} className={styles.link}>
                  Track
                </a>
              </>
            ) : null}
          </p>
        ) : (
          <p>Tracking will appear here after dispatch.</p>
        )}
      </section>

      <p>
        Need help?{" "}
        <Link href="/contact/" className={styles.link}>
          Contact PLEBS
        </Link>{" "}
        at {getContactEmail()} and include {order.number}.
      </p>
    </>
  );
}
