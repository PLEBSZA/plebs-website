"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { normalizeEmail } from "@/lib/account/email";
import { isAdminRole } from "@/lib/account/roles";
import { recordAuditEvent } from "@/lib/admin/audit";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = normalizeEmail(parsed.data.email);

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
    select: { id: true, role: true },
  });

  if (!user || !isAdminRole(user.role)) {
    await signOut({ redirect: false });
    return { error: "Invalid email or password." };
  }

  await recordAuditEvent({
    actorId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
