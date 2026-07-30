import type { ReactNode } from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "react-email";
import { emailBrand } from "./brand";

type BrandedEmailProps = {
  preview: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  hero?: keyof Pick<typeof emailBrand.assets, "product" | "foldedDetail">;
  unsubscribeUrl?: string;
};

export function BrandedEmail({
  preview,
  eyebrow,
  title,
  children,
  hero,
  unsubscribeUrl,
}: BrandedEmailProps) {
  const heroAsset = hero ? emailBrand.assets[hero] : null;

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Link href={emailBrand.links.home} aria-label="Visit PLEBS">
              <Img
                src={emailBrand.assets.logo.src}
                width={emailBrand.assets.logo.width}
                height={emailBrand.assets.logo.height}
                alt={emailBrand.assets.logo.alt}
                style={styles.logo}
              />
            </Link>
          </Section>

          {heroAsset ? (
            <Img
              src={heroAsset.src}
              width={heroAsset.width}
              height={heroAsset.height}
              alt={heroAsset.alt}
              style={styles.hero}
            />
          ) : null}

          <Section style={styles.content}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Heading as="h1" style={styles.heading}>
              {title}
            </Heading>
            {children}
          </Section>

          <Section style={styles.footer}>
            <Hr style={styles.footerRule} />
            <Text style={styles.footerText}>
              PLEBS · 100% cotton corduroy · 350 GSM
            </Text>
            <Text style={styles.footerText}>
              <Link href={emailBrand.links.contact} style={styles.footerLink}>
                Contact us
              </Link>
              {" · "}
              <Link href={emailBrand.links.care} style={styles.footerLink}>
                Care guide
              </Link>
              {" · "}
              <Link href={emailBrand.links.sizeGuide} style={styles.footerLink}>
                Size guide
              </Link>
            </Text>
            <Text style={styles.footerText}>
              Questions? Email{" "}
              <Link
                href={`mailto:${emailBrand.contactEmail}`}
                style={styles.footerLink}
              >
                {emailBrand.contactEmail}
              </Link>
              .
            </Text>
            {unsubscribeUrl ? (
              <Text style={styles.unsubscribe}>
                You received this because you subscribed to PLEBS updates.{" "}
                <Link href={unsubscribeUrl} style={styles.footerLink}>
                  Unsubscribe or manage preferences
                </Link>
                .
              </Text>
            ) : null}
            <Text style={styles.legal}>PLEBS · South Africa</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={styles.buttonSection}>
      <Button href={href} style={styles.button}>
        {children}
      </Button>
    </Section>
  );
}

export function DetailCard({ children }: { children: ReactNode }) {
  return <Section style={styles.card}>{children}</Section>;
}

export function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <Row style={styles.detailRow}>
      <Column style={styles.detailLabel}>{label}</Column>
      <Column
        align="right"
        style={strong ? styles.detailValueStrong : styles.detailValue}
      >
        {value}
      </Column>
    </Row>
  );
}

export function Divider() {
  return <Hr style={styles.divider} />;
}

export function SmallPrint({ children }: { children: ReactNode }) {
  return <Text style={styles.smallPrint}>{children}</Text>;
}

const styles = {
  body: {
    margin: "0",
    padding: "24px 12px",
    backgroundColor: emailBrand.colors.creamDeep,
    color: emailBrand.colors.charcoal,
    fontFamily:
      '"Segoe UI", Arial, Helvetica, sans-serif',
  },
  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    overflow: "hidden",
    border: `1px solid ${emailBrand.colors.sandBorder}`,
    borderRadius: "18px",
    backgroundColor: emailBrand.colors.cream,
  },
  header: {
    padding: "28px 32px 24px",
    textAlign: "center" as const,
    backgroundColor: emailBrand.colors.cream,
  },
  logo: {
    display: "block",
    margin: "0 auto",
  },
  hero: {
    display: "block",
    width: "100%",
    maxWidth: "600px",
    height: "auto",
  },
  content: {
    padding: "34px 38px 24px",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: emailBrand.colors.moss,
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1.2px",
    lineHeight: "18px",
    textTransform: "uppercase" as const,
  },
  heading: {
    margin: "0 0 22px",
    color: emailBrand.colors.forest,
    fontFamily:
      'Georgia, "Times New Roman", serif',
    fontSize: "34px",
    fontWeight: "600",
    lineHeight: "40px",
  },
  paragraph: {
    margin: "0 0 18px",
    color: emailBrand.colors.charcoal,
    fontSize: "16px",
    lineHeight: "26px",
  },
  buttonSection: {
    margin: "26px 0",
    textAlign: "left" as const,
  },
  button: {
    display: "inline-block",
    padding: "14px 24px",
    borderRadius: "4px",
    backgroundColor: emailBrand.colors.forest,
    color: emailBrand.colors.white,
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: "20px",
    textDecoration: "none",
  },
  card: {
    margin: "22px 0",
    padding: "20px",
    border: `1px solid ${emailBrand.colors.sandBorder}`,
    borderRadius: "10px",
    backgroundColor: emailBrand.colors.sand,
  },
  detailRow: {
    width: "100%",
    margin: "0",
    padding: "7px 0",
  },
  detailLabel: {
    width: "45%",
    color: emailBrand.colors.muted,
    fontSize: "14px",
    lineHeight: "20px",
  },
  detailValue: {
    color: emailBrand.colors.charcoal,
    fontSize: "14px",
    lineHeight: "20px",
  },
  detailValueStrong: {
    color: emailBrand.colors.forest,
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: "22px",
  },
  divider: {
    margin: "24px 0",
    borderColor: emailBrand.colors.sandBorder,
  },
  smallPrint: {
    margin: "14px 0 0",
    color: emailBrand.colors.muted,
    fontSize: "13px",
    lineHeight: "20px",
  },
  footer: {
    padding: "0 38px 30px",
    textAlign: "center" as const,
  },
  footerRule: {
    margin: "6px 0 24px",
    borderColor: emailBrand.colors.sandBorder,
  },
  footerText: {
    margin: "0 0 8px",
    color: emailBrand.colors.muted,
    fontSize: "12px",
    lineHeight: "18px",
  },
  footerLink: {
    color: emailBrand.colors.forest,
    textDecoration: "underline",
  },
  unsubscribe: {
    margin: "18px 0 8px",
    color: emailBrand.colors.muted,
    fontSize: "11px",
    lineHeight: "17px",
  },
  legal: {
    margin: "0",
    color: emailBrand.colors.muted,
    fontSize: "11px",
    lineHeight: "17px",
  },
} as const;
