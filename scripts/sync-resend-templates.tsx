import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { render } from "react-email";
import { Resend } from "resend";
import { emailTemplateAliases } from "../src/lib/email/template-aliases";
import {
  AbandonedCheckoutEmail,
  BackInStockEmail,
  ContactInquiryOwnerEmail,
  ContactReceivedEmail,
  DeliveryConfirmationEmail,
  EditorialAnnouncementEmail,
  NewsletterUpdateEmail,
  NewsletterWelcomeEmail,
  NewPaidOrderOwnerEmail,
  OrderCancelledEmail,
  OrderConfirmedEmail,
  RefundConfirmationEmail,
  RestockRequestedEmail,
  ReturnReceivedEmail,
  ReturnRequestOwnerEmail,
  ShippingConfirmationEmail,
} from "../src/lib/email/templates";

config({ path: ".env.local" });
config({ path: ".env" });

const variable = (key: string, fallbackValue?: string) => ({
  key,
  type: "string" as const,
  ...(fallbackValue === undefined ? {} : { fallbackValue }),
});
const placeholder = (key: string) => `{{{${key}}}}`;
const unsubscribeUrl = "{{{RESEND_UNSUBSCRIBE_URL}}}";
const transactionalFrom = "PLEBS <orders@plebs.co.za>";
const marketingFrom = "PLEBS <hello@plebs.co.za>";

const definitions = [
  {
    alias: emailTemplateAliases.contactReceived,
    name: "PLEBS · Contact received",
    subject: "We received your PLEBS enquiry",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ENQUIRY_TYPE", "General enquiry"),
    ],
    component: (
      <ContactReceivedEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        enquiryType={placeholder("ENQUIRY_TYPE")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.contactOwner,
    name: "PLEBS · Contact enquiry · Owner",
    subject: "{{{ENQUIRY_TYPE}}} · {{{CUSTOMER_NAME}}}",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_NAME"),
      variable("CUSTOMER_EMAIL"),
      variable("ENQUIRY_TYPE"),
      variable("ORDER_NUMBER", "Not provided"),
      variable("MESSAGE"),
    ],
    component: (
      <ContactInquiryOwnerEmail
        name={placeholder("CUSTOMER_NAME")}
        email={placeholder("CUSTOMER_EMAIL")}
        enquiryType={placeholder("ENQUIRY_TYPE")}
        orderNumber={placeholder("ORDER_NUMBER")}
        message={placeholder("MESSAGE")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.orderConfirmed,
    name: "PLEBS · Payment & order confirmed",
    subject: "Your PLEBS order {{{ORDER_NUMBER}}} is confirmed",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ORDER_NUMBER"),
      variable("TOTAL"),
      variable("PRODUCT_NAME", "100% Cotton Corduroy Dungarees"),
      variable("COLOUR"),
      variable("SIZE"),
      variable("QUANTITY"),
    ],
    component: (
      <OrderConfirmedEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        orderNumber={placeholder("ORDER_NUMBER")}
        total={placeholder("TOTAL")}
        line={{
          name: placeholder("PRODUCT_NAME"),
          colour: placeholder("COLOUR"),
          size: placeholder("SIZE"),
          quantity: placeholder("QUANTITY"),
          lineTotal: placeholder("TOTAL"),
        }}
      />
    ),
  },
  {
    alias: emailTemplateAliases.orderOwner,
    name: "PLEBS · Paid order · Owner",
    subject: "Paid order {{{ORDER_NUMBER}}} · {{{TOTAL}}}",
    from: transactionalFrom,
    variables: [
      variable("ORDER_NUMBER"),
      variable("CUSTOMER_NAME"),
      variable("CUSTOMER_EMAIL"),
      variable("PRODUCT_NAME", "100% Cotton Corduroy Dungarees"),
      variable("COLOUR"),
      variable("SIZE"),
      variable("QUANTITY"),
      variable("TOTAL"),
    ],
    component: (
      <NewPaidOrderOwnerEmail
        orderNumber={placeholder("ORDER_NUMBER")}
        customerName={placeholder("CUSTOMER_NAME")}
        customerEmail={placeholder("CUSTOMER_EMAIL")}
        productName={placeholder("PRODUCT_NAME")}
        colour={placeholder("COLOUR")}
        size={placeholder("SIZE")}
        quantity={placeholder("QUANTITY")}
        total={placeholder("TOTAL")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.restockRequested,
    name: "PLEBS · Restock request saved",
    subject: "Restock request saved · {{{COLOUR}}}, size {{{SIZE}}}",
    from: transactionalFrom,
    variables: [variable("COLOUR"), variable("SIZE")],
    component: (
      <RestockRequestedEmail
        colour={placeholder("COLOUR")}
        size={placeholder("SIZE")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.shippingConfirmation,
    name: "PLEBS · Shipping confirmation",
    subject: "Your PLEBS order {{{ORDER_NUMBER}}} is on its way",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ORDER_NUMBER"),
      variable("COURIER"),
      variable("TRACKING_NUMBER"),
      variable("TRACKING_URL"),
      variable("TRACKING_CTA", "Track your order"),
    ],
    component: (
      <ShippingConfirmationEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        orderNumber={placeholder("ORDER_NUMBER")}
        courier={placeholder("COURIER")}
        trackingNumber={placeholder("TRACKING_NUMBER")}
        trackingUrl={placeholder("TRACKING_URL")}
        trackingCta={placeholder("TRACKING_CTA")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.deliveryConfirmation,
    name: "PLEBS · Delivery confirmation",
    subject: "Your PLEBS order {{{ORDER_NUMBER}}} has arrived",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ORDER_NUMBER"),
      variable("DELIVERED_ON"),
      variable("SUPPORT_URL", "https://www.plebs.co.za/contact/"),
      variable("RETURNS_URL", "https://www.plebs.co.za/shipping-returns/"),
    ],
    component: (
      <DeliveryConfirmationEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        orderNumber={placeholder("ORDER_NUMBER")}
        deliveredOn={placeholder("DELIVERED_ON")}
        supportUrl={placeholder("SUPPORT_URL")}
        returnsUrl={placeholder("RETURNS_URL")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.returnReceived,
    name: "PLEBS · Return received",
    subject: "We received your PLEBS return {{{RETURN_REFERENCE}}}",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ORDER_NUMBER"),
      variable("RETURN_REFERENCE"),
      variable("ITEM_DESCRIPTION"),
    ],
    component: (
      <ReturnReceivedEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        orderNumber={placeholder("ORDER_NUMBER")}
        returnReference={placeholder("RETURN_REFERENCE")}
        itemDescription={placeholder("ITEM_DESCRIPTION")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.refundConfirmation,
    name: "PLEBS · Refund confirmation",
    subject: "Refund processed for order {{{ORDER_NUMBER}}}",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ORDER_NUMBER"),
      variable("AMOUNT"),
    ],
    component: (
      <RefundConfirmationEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        orderNumber={placeholder("ORDER_NUMBER")}
        amount={placeholder("AMOUNT")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.orderCancelled,
    name: "PLEBS · Order cancelled",
    subject: "Order {{{ORDER_NUMBER}}} has been cancelled",
    from: transactionalFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ORDER_NUMBER"),
    ],
    component: (
      <OrderCancelledEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        orderNumber={placeholder("ORDER_NUMBER")}
      />
    ),
  },
  {
    alias: emailTemplateAliases.newsletterWelcome,
    name: "PLEBS · Newsletter welcome",
    subject: "Welcome to PLEBS",
    from: marketingFrom,
    variables: [variable("CUSTOMER_FIRST_NAME", "there")],
    component: (
      <NewsletterWelcomeEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        unsubscribeUrl={unsubscribeUrl}
      />
    ),
  },
  {
    alias: emailTemplateAliases.newsletterUpdate,
    name: "PLEBS · News & updates",
    subject: "{{{HEADLINE}}}",
    from: marketingFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("HEADLINE"),
      variable("INTRODUCTION"),
      variable("STORY"),
      variable("CTA_LABEL"),
      variable("CTA_URL"),
    ],
    component: (
      <NewsletterUpdateEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        headline={placeholder("HEADLINE")}
        introduction={placeholder("INTRODUCTION")}
        story={placeholder("STORY")}
        ctaLabel={placeholder("CTA_LABEL")}
        ctaUrl={placeholder("CTA_URL")}
        unsubscribeUrl={unsubscribeUrl}
      />
    ),
  },
  {
    alias: emailTemplateAliases.abandonedCheckout,
    name: "PLEBS · Abandoned checkout",
    subject: "Your PLEBS checkout is still waiting",
    from: marketingFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("ORDER_NUMBER"),
      variable("COLOUR"),
      variable("SIZE"),
      variable("TOTAL"),
      variable("CHECKOUT_URL"),
    ],
    component: (
      <AbandonedCheckoutEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        orderNumber={placeholder("ORDER_NUMBER")}
        colour={placeholder("COLOUR")}
        size={placeholder("SIZE")}
        total={placeholder("TOTAL")}
        checkoutUrl={placeholder("CHECKOUT_URL")}
        unsubscribeUrl={unsubscribeUrl}
      />
    ),
  },
  {
    alias: emailTemplateAliases.backInStock,
    name: "PLEBS · Back in stock",
    subject: "{{{COLOUR}}}, size {{{SIZE}}} is back in stock",
    from: marketingFrom,
    variables: [
      variable("CUSTOMER_FIRST_NAME", "there"),
      variable("COLOUR"),
      variable("SIZE"),
      variable("PRODUCT_URL"),
    ],
    component: (
      <BackInStockEmail
        firstName={placeholder("CUSTOMER_FIRST_NAME")}
        colour={placeholder("COLOUR")}
        size={placeholder("SIZE")}
        productUrl={placeholder("PRODUCT_URL")}
        unsubscribeUrl={unsubscribeUrl}
      />
    ),
  },
  {
    alias: emailTemplateAliases.editorialAnnouncement,
    name: "PLEBS · Editorial announcement",
    subject: "{{{HEADLINE}}}",
    from: marketingFrom,
    variables: [
      variable("HEADLINE"),
      variable("COPY"),
      variable("CTA_LABEL"),
      variable("CTA_URL"),
    ],
    component: (
      <EditorialAnnouncementEmail
        headline={placeholder("HEADLINE")}
        copy={placeholder("COPY")}
        ctaLabel={placeholder("CTA_LABEL")}
        ctaUrl={placeholder("CTA_URL")}
        unsubscribeUrl={unsubscribeUrl}
      />
    ),
  },
  {
    alias: emailTemplateAliases.returnRequestOwner,
    name: "PLEBS · Return request · Owner",
    subject: "{{{REQUEST_TYPE}}} request for order {{{ORDER_NUMBER}}}",
    from: transactionalFrom,
    variables: [
      variable("ORDER_NUMBER"),
      variable("CUSTOMER_NAME"),
      variable("REQUEST_TYPE"),
      variable("REASON"),
    ],
    component: (
      <ReturnRequestOwnerEmail
        orderNumber={placeholder("ORDER_NUMBER")}
        customerName={placeholder("CUSTOMER_NAME")}
        requestType={placeholder("REQUEST_TYPE")}
        reason={placeholder("REASON")}
      />
    ),
  },
] as const;

async function main() {
  const payloads = await Promise.all(
    definitions.map(async (definition) => ({
      name: definition.name,
      alias: definition.alias,
      subject: definition.subject,
      from: definition.from,
      html: await render(definition.component),
      text: await render(definition.component, { plainText: true }),
      variables: [...definition.variables],
    })),
  );

  if (process.argv.includes("--export")) {
    const exportDir = path.join(process.cwd(), ".resend-template-export");
    await rm(exportDir, { recursive: true, force: true });
    await mkdir(exportDir, { recursive: true });
    await Promise.all(
      payloads.map((payload) =>
        writeFile(
          path.join(exportDir, `${payload.alias}.json`),
          JSON.stringify(payload),
          "utf8",
        ),
      ),
    );
    console.log(`Exported ${payloads.length} Resend templates.`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to sync email templates.");
  }

  const resend = new Resend(apiKey);
  const { data: listed, error: listError } = await resend.templates.list({
    limit: 100,
  });
  if (listError) throw new Error(listError.message);

  const existingTemplates = listed?.data ?? [];

  for (const payload of payloads) {
    const existing = existingTemplates.find(
      (template) => template.alias === payload.alias,
    );

    const result = existing
      ? await resend.templates.update(existing.id, payload)
      : await resend.templates.create(payload);
    if (result.error) {
      throw new Error(`${payload.alias}: ${result.error.message}`);
    }

    const templateId = result.data?.id ?? existing?.id;
    if (!templateId) {
      throw new Error(`${payload.alias}: Resend returned no template ID.`);
    }

    const published = await resend.templates.publish(templateId);
    if (published.error) {
      throw new Error(`${payload.alias}: ${published.error.message}`);
    }

    console.log(`Published ${payload.alias}`);
  }
}

void main();
