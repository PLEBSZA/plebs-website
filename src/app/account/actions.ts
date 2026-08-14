"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AccountTokenPurpose, OutboxEventType } from "@/generated/prisma/client";
import { signIn, signOut } from "@/auth";
import {
  CONSENT_WORDING,
  GENERIC_ACCOUNT_RESPONSE,
  MIN_PASSWORD_LENGTH,
} from "@/lib/account/consent";
import {
  activateNewsletter,
  withdrawNewsletter,
} from "@/lib/account/consent-service";
import { requireCustomerSession, setPasswordFromToken } from "@/lib/account/customer-dal";
import { normalizeEmail, parseNormalizedEmail } from "@/lib/account/email";
import { enqueueOutbox, scheduleOutboxProcessing } from "@/lib/account/outbox";
import { ensureCustomerAccount } from "@/lib/account/ensure-account";
import { recoveryOutboxEventType } from "@/lib/account/policy";
import { consumeThrottle } from "@/lib/account/throttle";
import { consumeAccountToken } from "@/lib/account/tokens";
import { safeInternalCallbackPath } from "@/lib/auth/callback-url";
import { db } from "@/lib/db";

export type AccountFormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(MIN_PASSWORD_LENGTH, "Password must be at least 8 characters."),
});

export async function customerLoginAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = normalizeEmail(parsed.data.email);
  const callbackUrl = safeInternalCallbackPath(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { customer: true },
  });
  if (!user?.customer) {
    await signOut({ redirect: false });
    return { error: "Invalid email or password." };
  }

  redirect(callbackUrl);
}

export async function registerAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = parseNormalizedEmail(String(formData.get("email") || ""));
  if (!email) {
    return { message: GENERIC_ACCOUNT_RESPONSE };
  }

  await db.$transaction(async (tx) => {
    const throttle = await consumeThrottle(tx, `register:${email}`);
    if (!throttle.allowed) return;
    const existing = await tx.user.findUnique({ where: { email } });
    const eventType = existing
      ? recoveryOutboxEventType({
          active: existing.active,
          passwordHash: existing.passwordHash,
          userRole: existing.role,
        })
      : "ACCOUNT_SETUP_EMAIL";
    if (!eventType) return;

    const account = await ensureCustomerAccount(tx, {
      email,
      source: CONSENT_WORDING.ACCOUNT_REGISTER.source,
      enqueueSetupEmail: false,
    });

    await enqueueOutbox(tx, {
      customerId: account.customer.id,
      eventType: OutboxEventType[eventType],
      idempotencyKey: `${eventType === "PASSWORD_RESET_EMAIL" ? "password-reset-email" : "account-setup-email"}/${account.user.id}/${new Date().toISOString().slice(0, 13)}`,
      payload: { userId: account.user.id },
      requeue: true,
    });
  });

  scheduleOutboxProcessing();
  return { message: GENERIC_ACCOUNT_RESPONSE };
}

export async function customerLogoutAction() {
  await signOut({ redirectTo: "/account/login/" });
}

export async function forgotPasswordAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = parseNormalizedEmail(String(formData.get("email") || ""));
  if (!email) {
    return { message: GENERIC_ACCOUNT_RESPONSE };
  }

  await db.$transaction(async (tx) => {
    const throttle = await consumeThrottle(tx, `forgot:${email}`);
    if (!throttle.allowed) return;
    const user = await tx.user.findUnique({ where: { email } });
    if (!user) return;
    const eventType = recoveryOutboxEventType({
      active: user.active,
      passwordHash: user.passwordHash,
      userRole: user.role,
    });
    if (!eventType) return;
    await enqueueOutbox(tx, {
      customerId: null,
      eventType: OutboxEventType[eventType],
      idempotencyKey: `${eventType === "PASSWORD_RESET_EMAIL" ? "password-reset-email" : "account-setup-email"}/${user.id}/${new Date().toISOString().slice(0, 13)}`,
      payload: { userId: user.id },
      requeue: true,
    });
  });

  scheduleOutboxProcessing();
  return { message: GENERIC_ACCOUNT_RESPONSE };
}

export async function activateAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirmPassword") || "");
  const token = String(formData.get("token") || "");
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }
  const result = await setPasswordFromToken({
    rawToken: token,
    purpose: AccountTokenPurpose.ACCOUNT_SETUP,
    password,
  });
  if (!result.ok) return { error: result.message };
  redirect("/account/login/?activated=1");
}

export async function resetPasswordAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirmPassword") || "");
  const token = String(formData.get("token") || "");
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }
  const result = await setPasswordFromToken({
    rawToken: token,
    purpose: AccountTokenPurpose.PASSWORD_RESET,
    password,
  });
  if (!result.ok) return { error: result.message };
  redirect("/account/login/?reset=1");
}

export async function confirmNewsletterAction(token: string) {
  const copy = CONSENT_WORDING.NEWSLETTER_EMAIL;
  const result = await db.$transaction(async (tx) => {
    const consumed = await consumeAccountToken(tx, {
      rawToken: token,
      purpose: AccountTokenPurpose.NEWSLETTER_CONFIRM,
    });
    if (!consumed) return { ok: false as const };
    const customer = await tx.customer.findUnique({
      where: { userId: consumed.userId },
    });
    if (!customer) return { ok: false as const };
    await activateNewsletter(tx, {
      customerId: customer.id,
      source: copy.source,
      wording: copy.text,
      wordingVersion: copy.version,
      actorId: consumed.userId,
    });
    return { ok: true as const };
  });
  if (result.ok) scheduleOutboxProcessing();
  return result;
}

export async function resendSetupAction(): Promise<void> {
  const session = await requireCustomerSession();
  await db.$transaction(async (tx) => {
    const throttle = await consumeThrottle(tx, `setup:${session.userId}`);
    if (!throttle.allowed) return;
    await enqueueOutbox(tx, {
      customerId: session.customerId,
      eventType: OutboxEventType.ACCOUNT_SETUP_EMAIL,
      idempotencyKey: `account-setup-email/${session.userId}`,
      payload: { userId: session.userId },
      requeue: true,
    });
  });
  scheduleOutboxProcessing();
}

export async function updateProfileAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await requireCustomerSession();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!firstName || !lastName) {
    return { error: "Enter your first and last name." };
  }
  await db.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: session.customerId },
      data: { firstName, lastName, phone: phone || null },
    });
    await tx.user.update({
      where: { id: session.userId },
      data: { name: `${firstName} ${lastName}` },
    });
  });
  return { message: "Profile saved." };
}

export async function saveAddressAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await requireCustomerSession();
  const id = String(formData.get("id") || "");
  const data = {
    firstName: String(formData.get("firstName") || "").trim() || null,
    lastName: String(formData.get("lastName") || "").trim() || null,
    line1: String(formData.get("line1") || "").trim(),
    line2: String(formData.get("line2") || "").trim() || null,
    city: String(formData.get("city") || "").trim(),
    province: String(formData.get("province") || "").trim(),
    postalCode: String(formData.get("postalCode") || "").trim(),
    country: "South Africa",
    phone: String(formData.get("phone") || "").trim() || null,
  };
  if (!data.line1 || !data.city || !data.province || !data.postalCode) {
    return { error: "Enter a complete South African delivery address." };
  }
  if (id) {
    await db.address.updateMany({
      where: { id, customerId: session.customerId },
      data,
    });
  } else {
    await db.address.create({
      data: { ...data, customerId: session.customerId },
    });
  }
  return { message: "Address saved. Past orders keep their original snapshot." };
}

export async function deleteAddressAction(formData: FormData) {
  const session = await requireCustomerSession();
  const id = String(formData.get("id") || "");
  await db.address.deleteMany({
    where: { id, customerId: session.customerId },
  });
}

export async function updateNewsletterPreferenceAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await requireCustomerSession();
  const optedIn = formData.get("newsletter") === "on";
  const copy = CONSENT_WORDING.ACCOUNT_PREFERENCES_NEWSLETTER;

  await db.$transaction(async (tx) => {
    if (optedIn) {
      await activateNewsletter(tx, {
        customerId: session.customerId,
        source: copy.source,
        wording: copy.text,
        wordingVersion: copy.version,
        actorId: session.userId,
      });
    } else {
      await withdrawNewsletter(tx, {
        customerId: session.customerId,
        source: copy.source,
        wording: "I no longer want PLEBS news and product update emails.",
        wordingVersion: copy.version,
        actorId: session.userId,
      });
    }
  });
  scheduleOutboxProcessing();
  return {
    message: optedIn
      ? "You are subscribed to PLEBS news and updates."
      : "You have been unsubscribed from PLEBS news and updates.",
  };
}
