import "server-only";

import { AccountTokenPurpose } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hashAccountToken, issueAccountToken } from "@/lib/account/tokens";
import { getTransactionalSiteUrl } from "@/lib/env";
import { getContactEmail, sendEmail } from "@/lib/email/resend";
import { emailTemplateAliases } from "@/lib/email/template-aliases";

export class AccountEmailRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountEmailRetryableError";
  }
}

function firstNameFrom(name: string | null | undefined, email: string) {
  const fromName = name?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  return email.split("@")[0] || "there";
}

function accountUrl(path: string, token: string) {
  const url = new URL(path, `${getTransactionalSiteUrl()}/`);
  url.searchParams.set("token", token);
  return url.toString();
}

function requireIssuedToken(issued: {
  rawToken: string;
  cooldown: boolean;
  dailyLimit: boolean;
}) {
  if (issued.rawToken) return issued.rawToken;
  if (issued.dailyLimit) {
    throw new AccountEmailRetryableError("Account token daily limit reached.");
  }
  if (issued.cooldown) {
    throw new AccountEmailRetryableError("Account token cooldown is active.");
  }
  throw new AccountEmailRetryableError("Account token could not be issued.");
}

export async function sendAccountSetupEmail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { customer: true },
  });
  if (!user?.email || user.passwordHash) return;

  const issued = await db.$transaction((tx) =>
    issueAccountToken(tx, {
      userId: user.id,
      purpose: AccountTokenPurpose.ACCOUNT_SETUP,
    }),
  );
  const rawToken = requireIssuedToken(issued);

  const firstName = firstNameFrom(user.name ?? user.customer?.firstName, user.email);
  await sendEmail({
    to: user.email,
    replyTo: getContactEmail(),
    subject: "Set up your PLEBS account",
    idempotencyKey: `account-setup/${hashAccountToken(rawToken)}`,
    template: {
      id: emailTemplateAliases.accountSetup,
      variables: {
        CUSTOMER_FIRST_NAME: firstName,
        SETUP_URL: accountUrl("/account/activate/", rawToken),
      },
    },
  });
}

export async function sendPasswordResetEmail(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.email || !user.passwordHash) return;

  const issued = await db.$transaction((tx) =>
    issueAccountToken(tx, {
      userId: user.id,
      purpose: AccountTokenPurpose.PASSWORD_RESET,
    }),
  );
  const rawToken = requireIssuedToken(issued);

  const firstName = firstNameFrom(user.name, user.email);
  await sendEmail({
    to: user.email,
    replyTo: getContactEmail(),
    subject: "Reset your PLEBS password",
    idempotencyKey: `password-reset/${hashAccountToken(rawToken)}`,
    template: {
      id: emailTemplateAliases.passwordReset,
      variables: {
        CUSTOMER_FIRST_NAME: firstName,
        RESET_URL: accountUrl("/account/reset-password/", rawToken),
      },
    },
  });
}

export async function sendNewsletterConfirmEmail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { customer: true },
  });
  if (!user?.email) return;

  const issued = await db.$transaction((tx) =>
    issueAccountToken(tx, {
      userId: user.id,
      purpose: AccountTokenPurpose.NEWSLETTER_CONFIRM,
    }),
  );
  const rawToken = requireIssuedToken(issued);

  const firstName = firstNameFrom(user.name ?? user.customer?.firstName, user.email);
  await sendEmail({
    to: user.email,
    replyTo: getContactEmail(),
    subject: "Confirm your PLEBS newsletter subscription",
    idempotencyKey: `newsletter-confirm/${hashAccountToken(rawToken)}`,
    template: {
      id: emailTemplateAliases.newsletterConfirm,
      variables: {
        CUSTOMER_FIRST_NAME: firstName,
        CONFIRM_URL: accountUrl("/account/confirm-newsletter/", rawToken),
      },
    },
  });
}

export async function sendNewsletterWelcome(customer: {
  email: string;
  firstName: string | null;
}) {
  const firstName = firstNameFrom(customer.firstName, customer.email);
  await sendEmail({
    to: customer.email,
    replyTo: getContactEmail(),
    subject: "You’re subscribed to PLEBS news and updates",
    idempotencyKey: `newsletter-welcome/${customer.email}`,
    template: {
      id: emailTemplateAliases.newsletterWelcome,
      variables: {
        CUSTOMER_FIRST_NAME: firstName,
      },
    },
  });
}
