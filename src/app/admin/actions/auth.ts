"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
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

  try {
    await signIn("credentials", {
      email: parsed.data.email.trim().toLowerCase(),
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
    where: { email: parsed.data.email.trim().toLowerCase() },
    select: { id: true },
  });

  if (user) {
    await recordAuditEvent({
      actorId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
    });
  }

  redirect("/admin");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
