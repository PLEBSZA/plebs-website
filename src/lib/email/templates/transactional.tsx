import { Link, Text } from "react-email";
import {
  BrandedEmail,
  DetailCard,
  DetailRow,
  Divider,
  EmailButton,
  EmailText,
  SmallPrint,
} from "./BrandedEmail";
import { emailBrand } from "./brand";

export type OrderLineEmail = {
  name: string;
  colour: string;
  size: string;
  quantity: string | number;
  lineTotal: string;
};

export function ContactReceivedEmail({
  firstName,
  enquiryType,
}: {
  firstName: string;
  enquiryType: string;
}) {
  return (
    <BrandedEmail
      preview="We received your message and will get back to you."
      eyebrow="Message received"
      title={`Thanks, ${firstName}.`}
    >
      <EmailText>
        Your <strong>{enquiryType}</strong> has reached PLEBS. We’ll reply from{" "}
        {emailBrand.contactEmail} as soon as we can.
      </EmailText>
      <EmailText>
        If you need to add anything, reply directly to this email.
      </EmailText>
      <EmailButton href={emailBrand.links.product}>
        View the dungarees
      </EmailButton>
    </BrandedEmail>
  );
}

export function OrderConfirmedEmail({
  firstName,
  orderNumber,
  total,
  line,
}: {
  firstName: string;
  orderNumber: string;
  total: string;
  line: OrderLineEmail;
}) {
  return (
    <BrandedEmail
      preview={`Payment received for order ${orderNumber}.`}
      eyebrow="Payment & order confirmed"
      title={`Thank you, ${firstName}.`}
      hero="foldedDetail"
    >
      <EmailText>
        Your payment was successful and order <strong>{orderNumber}</strong> is
        confirmed. Paystack may also send a payment receipt; this email is your
        PLEBS order confirmation.
      </EmailText>
      <DetailCard>
        <Text style={styles.itemTitle}>{line.name}</Text>
        <DetailRow label="Colour" value={line.colour} />
        <DetailRow label="Size" value={line.size} />
        <DetailRow label="Quantity" value={line.quantity} />
        <Divider />
        <DetailRow label="Total paid" value={total} strong />
      </DetailCard>
      <EmailText>
        We’ll send tracking details when your order leaves us.
      </EmailText>
      <EmailButton href={emailBrand.links.care}>
        Read the corduroy care guide
      </EmailButton>
      <SmallPrint>
        Questions about this order? Reply to this email and include{" "}
        {orderNumber}.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function RestockRequestedEmail({
  firstName,
  colour,
  size,
}: {
  firstName?: string;
  colour: string;
  size: string;
}) {
  return (
    <BrandedEmail
      preview={`We saved your restock request for ${colour}, size ${size}.`}
      eyebrow="Restock request saved"
      title={firstName ? `You’re on the list, ${firstName}.` : "You’re on the list."}
      hero="product"
    >
      <EmailText>
        We saved your request for <strong>{colour}</strong> in{" "}
        <strong>size {size}</strong>. We’ll only email you about this requested
        restock.
      </EmailText>
      <DetailCard>
        <DetailRow label="Colour" value={colour} />
        <DetailRow label="Size" value={size} />
      </DetailCard>
      <SmallPrint>
        A restock request does not reserve stock. Availability will be
        first-come, first-served.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function ShippingConfirmationEmail({
  firstName,
  orderNumber,
  courier,
  trackingNumber,
  trackingUrl,
  trackingCta = "Track your order",
}: {
  firstName: string;
  orderNumber: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  trackingCta?: string;
}) {
  return (
    <BrandedEmail
      preview={`Order ${orderNumber} is on its way.`}
      eyebrow="Dispatched"
      title={`${firstName}, your PLEBS order is moving.`}
    >
      <EmailText>
        Order <strong>{orderNumber}</strong> has been handed to {courier}.
      </EmailText>
      <DetailCard>
        <DetailRow label="Courier" value={courier} />
        <DetailRow label="Tracking number" value={trackingNumber} />
      </DetailCard>
      {trackingUrl ? (
        <EmailButton href={trackingUrl}>{trackingCta}</EmailButton>
      ) : null}
      <EmailText>
        Once it arrives, let the corduroy hang naturally before its first wear.
      </EmailText>
      <SmallPrint>
        Tracking updates are controlled by the courier and may take a little
        time to appear.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function DeliveryConfirmationEmail({
  firstName,
  orderNumber,
  deliveredOn,
  supportUrl = "https://www.plebs.co.za/contact/",
  returnsUrl = "https://www.plebs.co.za/shipping-returns/",
}: {
  firstName: string;
  orderNumber: string;
  deliveredOn: string;
  supportUrl?: string;
  returnsUrl?: string;
}) {
  return (
    <BrandedEmail
      preview={`Order ${orderNumber} has arrived.`}
      eyebrow="Delivered"
      title={`${firstName}, your PLEBS order has arrived.`}
    >
      <EmailText>
        Order <strong>{orderNumber}</strong> was recorded as delivered on{" "}
        <strong>{deliveredOn}</strong>.
      </EmailText>
      <EmailText>
        If anything looks wrong with the parcel or the fit, get in touch and we
        will help from there.
      </EmailText>
      <EmailText>
        Need a return or exchange? Read the current guidance on our shipping
        and returns page, then contact us with your order number so we can help.
      </EmailText>
      <EmailButton href={returnsUrl}>Shipping &amp; returns</EmailButton>
      <EmailButton href={supportUrl}>Contact PLEBS</EmailButton>
      <SmallPrint>
        Keep this email handy if you need to quote your order number. Return
        windows and refund timing follow the policy published on our site.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function ReturnReceivedEmail({
  firstName,
  orderNumber,
  returnReference,
  itemDescription,
}: {
  firstName: string;
  orderNumber: string;
  returnReference: string;
  itemDescription: string;
}) {
  return (
    <BrandedEmail
      preview={`We received return ${returnReference}.`}
      eyebrow="Return received"
      title={`${firstName}, we have your return.`}
    >
      <EmailText>
        The parcel for return <strong>{returnReference}</strong> (order{" "}
        <strong>{orderNumber}</strong>) has arrived and will be inspected next.
      </EmailText>
      <DetailCard>
        <DetailRow label="Return reference" value={returnReference} />
        <DetailRow label="Item" value={itemDescription} />
        <DetailRow label="Order" value={orderNumber} />
      </DetailCard>
      <EmailText>
        Quote the return reference in any follow-up so we can find your case
        quickly.
      </EmailText>
      <SmallPrint>
        We will update you once inspection is complete. This email does not
        confirm a refund or exchange outcome.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function RefundConfirmationEmail({
  firstName,
  orderNumber,
  amount,
}: {
  firstName: string;
  orderNumber: string;
  amount: string;
}) {
  return (
    <BrandedEmail
      preview={`Your refund for order ${orderNumber} has been processed.`}
      eyebrow="Refund processed"
      title={`Your refund is on its way, ${firstName}.`}
    >
      <EmailText>
        We processed a refund of <strong>{amount}</strong> for order{" "}
        <strong>{orderNumber}</strong>.
      </EmailText>
      <EmailText>
        Your bank controls when the funds appear. Processing times vary by
        payment method and financial institution.
      </EmailText>
      <SmallPrint>
        If the refund has not appeared after your bank’s normal processing
        period, reply to this email with your order number.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function OrderCancelledEmail({
  firstName,
  orderNumber,
}: {
  firstName: string;
  orderNumber: string;
}) {
  return (
    <BrandedEmail
      preview={`Order ${orderNumber} has been cancelled.`}
      eyebrow="Order cancelled"
      title={`Your order has been cancelled, ${firstName}.`}
    >
      <EmailText>
        Order <strong>{orderNumber}</strong> is cancelled and its reserved stock
        has been released.
      </EmailText>
      <EmailText>
        No payment was taken. If you still want the dungarees, you can start a
        fresh checkout whenever you’re ready.
      </EmailText>
      <EmailButton href={emailBrand.links.product}>
        Return to the dungarees
      </EmailButton>
      <SmallPrint>
        If you did not request this cancellation,{" "}
        <Link
          href={`mailto:${emailBrand.contactEmail}`}
          style={styles.inlineLink}
        >
          contact us
        </Link>
        .
      </SmallPrint>
    </BrandedEmail>
  );
}

const styles = {
  itemTitle: {
    margin: "0 0 10px",
    color: emailBrand.colors.forest,
    fontSize: "17px",
    fontWeight: "700",
    lineHeight: "24px",
  },
  inlineLink: {
    color: emailBrand.colors.forest,
    textDecoration: "underline",
  },
} as const;
