import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import {
  AccountTokenPurpose,
  AdminRole,
} from "@/generated/prisma/client";
import { auth } from "@/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/account/consent";
import { isAdminRole } from "@/lib/account/roles";
import { consumeAccountToken } from "@/lib/account/tokens";
import { db } from "@/lib/db";

export type CustomerSession = {
  userId: string;
  customerId: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  hasPassword: boolean;
  emailVerified: Date | null;
};

export const getCustomerSession = cache(async (): Promise<CustomerSession | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { customer: true },
  });
  if (!user?.active || !user.customer) return null;

  return {
    userId: user.id,
    customerId: user.customer.id,
    email: user.email ?? user.customer.email,
    name: user.name,
    firstName: user.customer.firstName,
    lastName: user.customer.lastName,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
    emailVerified: user.emailVerified,
  };
});

export async function requireCustomerSession() {
  const session = await getCustomerSession();
  if (session) return session;
  const authSession = await auth();
  if (isAdminRole(authSession?.user?.role)) {
    redirect("/admin/");
  }
  redirect("/account/login/");
}

export async function setPasswordFromToken(input: {
  rawToken: string;
  purpose: AccountTokenPurpose;
  password: string;
}) {
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false as const, message: "Password must be at least 8 characters." };
  }

  const passwordHash = await hash(input.password, 12);

  return db.$transaction(async (tx) => {
    const token = await consumeAccountToken(tx, {
      rawToken: input.rawToken,
      purpose: input.purpose,
    });
    if (!token) {
      return { ok: false as const, message: "This link is invalid or has expired." };
    }

    await tx.user.update({
      where: { id: token.userId },
      data: {
        passwordHash,
        emailVerified: new Date(),
        sessionVersion: { increment: 1 },
        role:
          token.user.role === AdminRole.CUSTOMER
            ? AdminRole.CUSTOMER
            : token.user.role,
      },
    });

    await tx.accountToken.updateMany({
      where: {
        userId: token.userId,
        purpose: { in: [AccountTokenPurpose.ACCOUNT_SETUP, AccountTokenPurpose.PASSWORD_RESET] },
        usedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { ok: true as const, email: token.user.email };
  });
}
