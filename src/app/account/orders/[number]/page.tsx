import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AccountDetailsList,
  AccountPageHeader,
  AccountPanel,
  AccountStatusBadge,
  fulfilmentBadgeTone,
  paymentBadgeTone,
} from "@/components/account/AccountPrimitives";
import { requireCustomerSession } from "@/lib/account/customer-dal";
import {
  formatAccountDate,
  friendlyFulfilmentStatus,
  friendlyPaymentStatus,
  friendlyReturnStatus,
  safeExternalHttpUrl,
} from "@/lib/account/account-ui";
import { getCustomerOrder } from "@/lib/account/queries";
import { getContactEmail } from "@/lib/email/resend";
import { createPageMetadata } from "@/lib/metadata";
import { formatMoney } from "@/lib/money";
import styles from "../../account.module.css";

export const metadata = createPageMetadata({
  title: "Order detail",
  description: "Your PLEBS order details and tracking.",
  path: "/account/orders/",
  noIndex: true,
});

type AddressSnapshot = {
  firstName?: string;
  lastName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const session = await requireCustomerSession();
  const { number } = await params;
  const order = await getCustomerOrder(session.customerId, number);
  if (!order) notFound();

  const shipping = (order.shippingAddress ?? {}) as AddressSnapshot;
  const payment = order.payments[0];
  const fulfilment = order.fulfilments[0];
  const trackingUrl = safeExternalHttpUrl(fulfilment?.trackingUrl);
  const recipient = [shipping.firstName, shipping.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <>
      <p className={styles.backLink}>
        <Link href="/account/orders/" className={styles.link}>
          Back to orders
        </Link>
      </p>
      <AccountPageHeader title={order.number}>
        <p>Placed {formatAccountDate(order.createdAt)}</p>
      </AccountPageHeader>

      <div className={styles.orderBadges}>
        <AccountStatusBadge tone={paymentBadgeTone(order.paymentStatus)}>
          {friendlyPaymentStatus(order.paymentStatus)}
        </AccountStatusBadge>
        <AccountStatusBadge tone={fulfilmentBadgeTone(order.fulfilmentStatus)}>
          {friendlyFulfilmentStatus(order.fulfilmentStatus)}
        </AccountStatusBadge>
      </div>

      <AccountPanel title="Items">
        <ul className={styles.itemList}>
          {order.items.map((item) => (
            <li key={item.id} className={styles.itemRow}>
              <div>
                <p className={styles.itemName}>{item.productName}</p>
                <p className={styles.orderMeta}>
                  {item.colour} · Size {item.size} · Qty {item.quantity}
                </p>
              </div>
              <p>{formatMoney(Number(item.lineTotal), order.currency)}</p>
            </li>
          ))}
        </ul>
        <AccountDetailsList
          items={[
            {
              term: "Subtotal",
              value: formatMoney(Number(order.subtotal), order.currency),
            },
            {
              term: "Delivery",
              value: formatMoney(Number(order.shippingTotal), order.currency),
            },
            {
              term: "Total",
              value: formatMoney(Number(order.total), order.currency),
            },
          ]}
        />
      </AccountPanel>

      <AccountPanel title="Delivery snapshot">
        <p>
          {recipient ? (
            <>
              {recipient}
              <br />
            </>
          ) : null}
          {shipping.phone ? (
            <>
              {shipping.phone}
              <br />
            </>
          ) : null}
          {shipping.line1}
          {shipping.line2 ? `, ${shipping.line2}` : ""}
          <br />
          {[shipping.city, shipping.province, shipping.postalCode]
            .filter(Boolean)
            .join(", ")}
          <br />
          {shipping.country ?? "South Africa"}
        </p>
        <p className={styles.formHelp}>
          This is the address used for this order. Changing saved addresses does
          not rewrite it.
        </p>
      </AccountPanel>

      <AccountPanel title="Fulfilment and tracking">
        {fulfilment?.trackingNumber || trackingUrl ? (
          <p>
            {fulfilment?.courier ?? "Courier"}
            {fulfilment?.trackingNumber ? ` · ${fulfilment.trackingNumber}` : ""}
            {trackingUrl ? (
              <>
                {" "}
                ·{" "}
                <a
                  href={trackingUrl}
                  className={styles.link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Track parcel
                </a>
              </>
            ) : null}
          </p>
        ) : (
          <p>Tracking will appear here after dispatch.</p>
        )}
        {payment?.provider ? (
          <p className={styles.formHelp}>Paid with {payment.provider}.</p>
        ) : null}
      </AccountPanel>

      {order.returnRequests.length > 0 ? (
        <AccountPanel title="Returns and refunds">
          <ul className={styles.itemList}>
            {order.returnRequests.map((request) => (
              <li key={request.id}>
                {request.reference} · {friendlyReturnStatus(request.status)}
                {request.refundReference ? ` · ${request.refundReference}` : ""}
              </li>
            ))}
          </ul>
        </AccountPanel>
      ) : null}

      <AccountPanel title="Need help?">
        <p>
          Include {order.number} when you write to us at {getContactEmail()}.
        </p>
        <p>
          <Link href="/contact/" className={styles.submit}>
            Contact PLEBS
          </Link>
        </p>
      </AccountPanel>
    </>
  );
}
