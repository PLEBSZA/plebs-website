import {
  BrandedEmail,
  DetailCard,
  DetailRow,
  EmailText,
  SmallPrint,
} from "./BrandedEmail";

export function ContactInquiryOwnerEmail({
  name,
  email,
  enquiryType,
  orderNumber,
  message,
}: {
  name: string;
  email: string;
  enquiryType: string;
  orderNumber?: string;
  message: string;
}) {
  return (
    <BrandedEmail
      preview={`${enquiryType} enquiry from ${name}.`}
      eyebrow="New contact enquiry"
      title={enquiryType}
    >
      <DetailCard>
        <DetailRow label="Name" value={name} />
        <DetailRow label="Email" value={email} />
        {orderNumber ? (
          <DetailRow label="Order" value={orderNumber} />
        ) : null}
      </DetailCard>
      <EmailText>{message}</EmailText>
      <SmallPrint>
        Reply to this email to respond directly to {name}.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function NewPaidOrderOwnerEmail({
  orderNumber,
  customerName,
  customerEmail,
  productName,
  colour,
  size,
  quantity,
  total,
}: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  colour: string;
  size: string;
  quantity: string | number;
  total: string;
}) {
  return (
    <BrandedEmail
      preview={`Paid order ${orderNumber} · ${total}`}
      eyebrow="New paid order"
      title={orderNumber}
    >
      <DetailCard>
        <DetailRow label="Customer" value={customerName} />
        <DetailRow label="Email" value={customerEmail} />
        <DetailRow label="Product" value={productName} />
        <DetailRow label="Colour" value={colour} />
        <DetailRow label="Size" value={size} />
        <DetailRow label="Quantity" value={quantity} />
        <DetailRow label="Total" value={total} strong />
      </DetailCard>
      <SmallPrint>
        Payment has been verified. The order is ready for fulfilment processing
        in the admin dashboard.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function ReturnRequestOwnerEmail({
  orderNumber,
  customerName,
  requestType,
  reason,
}: {
  orderNumber: string;
  customerName: string;
  requestType: string;
  reason: string;
}) {
  return (
    <BrandedEmail
      preview={`${requestType} request for order ${orderNumber}.`}
      eyebrow="Customer support"
      title={`New request: ${requestType}`}
    >
      <DetailCard>
        <DetailRow label="Order" value={orderNumber} />
        <DetailRow label="Customer" value={customerName} />
        <DetailRow label="Request" value={requestType} />
      </DetailCard>
      <EmailText>{reason}</EmailText>
      <SmallPrint>
        Review the request and update its status in the admin dashboard.
      </SmallPrint>
    </BrandedEmail>
  );
}
