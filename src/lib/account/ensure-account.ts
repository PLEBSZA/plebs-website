import "server-only";

import {
  AdminRole,
  CommunicationChannel,
  CommunicationPurpose,
  OutboxEventType,
  PreferenceStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { normalizeEmail } from "@/lib/account/email";
import { enqueueOutbox } from "@/lib/account/outbox";
import {
  customerUserRoleForCreate,
  shouldIssueSetupEmail,
} from "@/lib/account/policy";
import { db } from "@/lib/db";

export type AccountTx = Prisma.TransactionClient;

export type EnsureCustomerAccountInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  source: string;
  enqueueSetupEmail?: boolean;
};

export async function ensureCustomerAccount(
  tx: AccountTx,
  input: EnsureCustomerAccountInput,
) {
  const email = normalizeEmail(input.email);
  const displayName = [input.firstName, input.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const [existingCustomer, existingUser] = await Promise.all([
    tx.customer.findUnique({ where: { email } }),
    tx.user.findUnique({ where: { email } }),
  ]);

  let user = existingUser;
  if (!user) {
    user = await tx.user.create({
      data: {
        email,
        name: displayName || null,
        role: AdminRole.CUSTOMER,
        active: true,
      },
    });
  } else if (displayName && !user.name) {
    user = await tx.user.update({
      where: { id: user.id },
      data: { name: displayName },
    });
  }

  const role = customerUserRoleForCreate(user.role);
  if (user.role !== role && role === AdminRole.CUSTOMER) {
    user = await tx.user.update({
      where: { id: user.id },
      data: { role: AdminRole.CUSTOMER },
    });
  }

  let customer = existingCustomer;
  if (!customer) {
    customer = await tx.customer.create({
      data: {
        email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phone: input.phone ?? null,
        userId: user.id,
      },
    });
  } else {
    customer = await tx.customer.update({
      where: { id: customer.id },
      data: {
        firstName: input.firstName ?? customer.firstName,
        lastName: input.lastName ?? customer.lastName,
        phone: input.phone ?? customer.phone,
        userId: customer.userId ?? user.id,
      },
    });
  }

  await tx.communicationPreference.upsert({
    where: {
      customerId_purpose_channel: {
        customerId: customer.id,
        purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
        channel: CommunicationChannel.EMAIL,
      },
    },
    create: {
      customerId: customer.id,
      purpose: CommunicationPurpose.NEWSLETTER_EMAIL,
      channel: CommunicationChannel.EMAIL,
      status: PreferenceStatus.OPTED_OUT,
      source: input.source,
    },
    update: {},
  });

  const createdUser = !existingUser;
  const setupWanted =
    input.enqueueSetupEmail !== false &&
    shouldIssueSetupEmail({
      passwordHash: user.passwordHash,
      userRole: user.role,
    });

  if (setupWanted) {
    await enqueueOutbox(tx, {
      customerId: customer.id,
      eventType: OutboxEventType.ACCOUNT_SETUP_EMAIL,
      idempotencyKey: `account-setup-email/${user.id}`,
      payload: { userId: user.id, source: input.source },
    });
  }

  await enqueueOutbox(tx, {
    customerId: customer.id,
    eventType: OutboxEventType.RESEND_CONTACT_SYNC,
    idempotencyKey: `resend-contact/${customer.id}`,
    payload: { customerId: customer.id, source: input.source },
    requeue: true,
  });

  return {
    customer,
    user,
    createdUser,
    setupEnqueued: setupWanted,
  };
}

export async function ensureCustomerAccountStandalone(
  input: EnsureCustomerAccountInput,
) {
  return db.$transaction((tx) => ensureCustomerAccount(tx, input));
}
