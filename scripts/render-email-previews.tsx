import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { render } from "react-email";
import {
  AbandonedCheckoutEmail,
  AccountSetupEmail,
  BackInStockEmail,
  ContactInquiryOwnerEmail,
  ContactReceivedEmail,
  EditorialAnnouncementEmail,
  NewsletterConfirmEmail,
  NewsletterUpdateEmail,
  NewsletterWelcomeEmail,
  NewPaidOrderOwnerEmail,
  OrderCancelledEmail,
  OrderConfirmedEmail,
  RefundConfirmationEmail,
  RestockRequestedEmail,
  ReturnRequestOwnerEmail,
  ShippingConfirmationEmail,
  DeliveryConfirmationEmail,
  ReturnReceivedEmail,
  PasswordResetEmail,
  emailBrand,
} from "../src/lib/email/templates";

const unsubscribeUrl = "{{{RESEND_UNSUBSCRIBE_URL}}}";
const outputDir = path.join(process.cwd(), ".email-previews");
const line = {
  name: "100% Cotton Corduroy Dungarees",
  colour: "Forest Green",
  size: "S",
  quantity: 1,
  lineTotal: "R 1,399.00",
};

const previews = {
  "contact-received": (
    <ContactReceivedEmail
      firstName="Alex"
      enquiryType="Product and sizing question"
    />
  ),
  "contact-owner": (
    <ContactInquiryOwnerEmail
      name="Alex Example"
      email="alex@example.com"
      enquiryType="Product and sizing question"
      message="Could you help me choose between sizes S and M?"
    />
  ),
  "order-confirmed": (
    <OrderConfirmedEmail
      firstName="Alex"
      orderNumber="PLEBS-260730-001"
      total="R 1,399.00"
      line={line}
    />
  ),
  "order-owner": (
    <NewPaidOrderOwnerEmail
      orderNumber="PLEBS-260730-001"
      customerName="Alex Example"
      customerEmail="alex@example.com"
      productName={line.name}
      colour={line.colour}
      size={line.size}
      quantity={line.quantity}
      total={line.lineTotal}
    />
  ),
  "restock-requested": (
    <RestockRequestedEmail colour="Forest Green" size="M" firstName="Alex" />
  ),
  "shipping-confirmation": (
    <ShippingConfirmationEmail
      firstName="Alex"
      orderNumber="PLEBS-260730-001"
      courier="The Courier Guy"
      trackingNumber="TCG123456789"
      trackingUrl="https://www.example.com/track/TCG123456789"
    />
  ),
  "delivery-confirmation": (
    <DeliveryConfirmationEmail
      firstName="Alex"
      orderNumber="PLEBS-260730-001"
      deliveredOn="30 Jul 2026"
    />
  ),
  "return-received": (
    <ReturnReceivedEmail
      firstName="Alex"
      orderNumber="PLEBS-260730-001"
      returnReference="RMA-M8XYZ-421"
      itemDescription="Forest Green / S × 1"
    />
  ),
  "refund-confirmation": (
    <RefundConfirmationEmail
      firstName="Alex"
      orderNumber="PLEBS-260730-001"
      amount="R 1,399.00"
    />
  ),
  "order-cancelled": (
    <OrderCancelledEmail
      firstName="Alex"
      orderNumber="PLEBS-260730-001"
    />
  ),
  "newsletter-welcome": (
    <NewsletterWelcomeEmail
      firstName="Alex"
      unsubscribeUrl={unsubscribeUrl}
    />
  ),
  "newsletter-update": (
    <NewsletterUpdateEmail
      firstName="Alex"
      headline="A closer look at the cloth"
      introduction="Why 350 GSM cotton corduroy feels substantial without becoming precious."
      story="The mid-wale rib catches light, softens with wear and gives the dungarees enough structure to hold their shape."
      ctaLabel="Explore the fabric"
      ctaUrl="https://www.plebs.co.za/cotton-corduroy/"
      unsubscribeUrl={unsubscribeUrl}
    />
  ),
  "abandoned-checkout": (
    <AbandonedCheckoutEmail
      firstName="Alex"
      orderNumber="PLEBS-260730-001"
      colour="Forest Green"
      size="S"
      total="R 1,399.00"
      checkoutUrl="https://www.plebs.co.za/checkout/review/"
      unsubscribeUrl={unsubscribeUrl}
    />
  ),
  "back-in-stock": (
    <BackInStockEmail
      firstName="Alex"
      colour="Forest Green"
      size="M"
      unsubscribeUrl={unsubscribeUrl}
    />
  ),
  "editorial-announcement": (
    <EditorialAnnouncementEmail
      headline="Ordinary things, worn your way"
      copy="A new PLEBS story about the people, texture and small choices behind our original dungarees."
      ctaLabel="Read the story"
      ctaUrl="https://www.plebs.co.za/about/"
      unsubscribeUrl={unsubscribeUrl}
    />
  ),
  "return-request-owner": (
    <ReturnRequestOwnerEmail
      orderNumber="PLEBS-260730-001"
      customerName="Alex Example"
      requestType="Exchange"
      reason="I would like to exchange size S for size M."
    />
  ),
  "account-setup": (
    <AccountSetupEmail
      firstName="Alex"
      setupUrl="https://www.plebs.co.za/account/activate/?token=example"
    />
  ),
  "password-reset": (
    <PasswordResetEmail
      firstName="Alex"
      resetUrl="https://www.plebs.co.za/account/reset-password/?token=example"
    />
  ),
  "newsletter-confirm": (
    <NewsletterConfirmEmail
      firstName="Alex"
      confirmUrl="https://www.plebs.co.za/account/confirm-newsletter/?token=example"
    />
  ),
};

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    Object.entries(previews).map(async ([name, component]) => {
      const html = await render(component, { pretty: true });
      const localPreviewHtml = html.replaceAll(
        `${emailBrand.siteUrl}/images/`,
        "http://localhost:3001/images/",
      );
      await writeFile(
        path.join(outputDir, `${name}.html`),
        localPreviewHtml,
        "utf8",
      );
    }),
  );

  console.log(`Rendered ${Object.keys(previews).length} email previews.`);
}

void main();
