import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/account/roles";
import {
  assertPermission,
  hasPermission,
  type AdminPermission,
} from "@/lib/admin/permissions";
import type { AdminRole } from "@/generated/prisma/client";

export type AdminSessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: AdminRole;
};

export const getAdminSession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return null;
  if (!isAdminRole(session.user.role)) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    role: session.user.role,
  } satisfies AdminSessionUser;
});

export async function requireAdminSession(
  permission: AdminPermission = "admin:access",
) {
  const user = await getAdminSession();
  if (!user) {
    redirect("/admin/login");
  }
  assertPermission(user.role, permission);
  return user;
}

export async function adminCan(permission: AdminPermission) {
  const user = await getAdminSession();
  if (!user) return false;
  return hasPermission(user.role, permission);
}
