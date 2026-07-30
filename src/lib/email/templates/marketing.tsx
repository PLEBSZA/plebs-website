import { Text } from "react-email";
import {
  BrandedEmail,
  DetailCard,
  DetailRow,
  EmailButton,
  EmailText,
  SmallPrint,
} from "./BrandedEmail";
import { emailBrand } from "./brand";

type MarketingEmailProps = {
  unsubscribeUrl: string;
};

export function NewsletterWelcomeEmail({
  firstName,
  unsubscribeUrl,
}: MarketingEmailProps & { firstName?: string }) {
  return (
    <BrandedEmail
      preview="You’re subscribed to PLEBS news and product updates."
      eyebrow="Welcome to PLEBS"
      title={firstName ? `Good to have you here, ${firstName}.` : "Good to have you here."}
      hero="product"
      unsubscribeUrl={unsubscribeUrl}
    >
      <EmailText>
        You’re subscribed to PLEBS news and updates: restocks, product stories,
        campaign notes and occasional things worth sharing.
      </EmailText>
      <EmailText>
        We’ll keep it considered. No daily noise, no pretending ordinary things
        aren’t interesting.
      </EmailText>
      <EmailButton href={emailBrand.links.product}>
        Meet the original dungarees
      </EmailButton>
      <SmallPrint>
        You can update your preferences or unsubscribe at any time using the
        link below.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function NewsletterUpdateEmail({
  firstName,
  headline,
  introduction,
  story,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: MarketingEmailProps & {
  firstName?: string;
  headline: string;
  introduction: string;
  story: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return (
    <BrandedEmail
      preview={introduction}
      eyebrow="PLEBS news & updates"
      title={headline}
      hero="foldedDetail"
      unsubscribeUrl={unsubscribeUrl}
    >
      <EmailText>{firstName ? `Hello ${firstName}. ` : ""}{introduction}</EmailText>
      <EmailText>{story}</EmailText>
      <EmailButton href={ctaUrl}>{ctaLabel}</EmailButton>
      <SmallPrint>
        One design. Different people. Worn your way.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function AbandonedCheckoutEmail({
  firstName,
  orderNumber,
  colour,
  size,
  total,
  checkoutUrl,
  unsubscribeUrl,
}: MarketingEmailProps & {
  firstName?: string;
  orderNumber: string;
  colour: string;
  size: string;
  total: string;
  checkoutUrl: string;
}) {
  return (
    <BrandedEmail
      preview="Your PLEBS checkout is still waiting."
      eyebrow="Still thinking it over?"
      title={firstName ? `${firstName}, your dungarees are waiting.` : "Your dungarees are waiting."}
      hero="foldedDetail"
      unsubscribeUrl={unsubscribeUrl}
    >
      <EmailText>
        You started order <strong>{orderNumber}</strong> but didn’t complete
        payment. If you were interrupted, you can return to your review page.
      </EmailText>
      <DetailCard>
        <DetailRow label="Colour" value={colour} />
        <DetailRow label="Size" value={size} />
        <DetailRow label="Total" value={total} strong />
      </DetailCard>
      <EmailButton href={checkoutUrl}>Return to checkout</EmailButton>
      <SmallPrint>
        Stock is reserved only for the checkout reservation period and may
        become available to someone else afterward.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function BackInStockEmail({
  firstName,
  colour,
  size,
  productUrl = emailBrand.links.product,
  unsubscribeUrl,
}: MarketingEmailProps & {
  firstName?: string;
  colour: string;
  size: string;
  productUrl?: string;
}) {
  return (
    <BrandedEmail
      preview={`${colour}, size ${size} is back in stock.`}
      eyebrow="Back in stock"
      title={firstName ? `It’s back, ${firstName}.` : "It’s back."}
      hero="product"
      unsubscribeUrl={unsubscribeUrl}
    >
      <EmailText>
        The PLEBS cotton corduroy dungarees in <strong>{colour}</strong>,{" "}
        <strong>size {size}</strong> are available again.
      </EmailText>
      <EmailButton href={productUrl}>Shop your requested size</EmailButton>
      <SmallPrint>
        This message follows the restock request you made. Availability is not
        guaranteed and stock is first-come, first-served.
      </SmallPrint>
    </BrandedEmail>
  );
}

export function EditorialAnnouncementEmail({
  headline,
  copy,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: MarketingEmailProps & {
  headline: string;
  copy: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return (
    <BrandedEmail
      preview={copy}
      eyebrow="A note from PLEBS"
      title={headline}
      hero="product"
      unsubscribeUrl={unsubscribeUrl}
    >
      <EmailText>{copy}</EmailText>
      <EmailButton href={ctaUrl}>{ctaLabel}</EmailButton>
      <Text style={styles.signature}>PLEBS</Text>
    </BrandedEmail>
  );
}

const styles = {
  signature: {
    margin: "26px 0 0",
    color: emailBrand.colors.forest,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "24px",
    fontWeight: "600",
  },
} as const;
