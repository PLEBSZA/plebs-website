import "server-only";

import { AdminRole } from "@/generated/prisma/client";

export type AdminPermission =
  | "admin:access"
  | "products:read"
  | "products:write"
  | "inventory:read"
  | "inventory:write"
  | "costs:read"
  | "costs:write"
  | "orders:read"
  | "orders:fulfil"
  | "orders:refund"
  | "returns:manage"
  | "restock:read"
  | "restock:notify"
  | "media:write"
  | "users:manage"
  | "audit:read"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlyArray<AdminPermission>> = {
  OWNER: [
    "admin:access",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "costs:read",
    "costs:write",
    "orders:read",
    "orders:fulfil",
    "orders:refund",
    "returns:manage",
    "restock:read",
    "restock:notify",
    "media:write",
    "users:manage",
    "audit:read",
    "settings:manage",
  ],
  OPERATIONS_ADMIN: [
    "admin:access",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "costs:read",
    "costs:write",
    "orders:read",
    "orders:fulfil",
    "orders:refund",
    "returns:manage",
    "restock:read",
    "restock:notify",
    "media:write",
    "audit:read",
  ],
  FULFILMENT_USER: [
    "admin:access",
    "products:read",
    "inventory:read",
    "orders:read",
    "orders:fulfil",
    "restock:read",
  ],
  CONTENT_EDITOR: [
    "admin:access",
    "products:read",
    "products:write",
    "inventory:read",
    "media:write",
    "restock:read",
  ],
};

export function permissionsForRole(role: AdminRole): ReadonlyArray<AdminPermission> {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  return permissionsForRole(role).includes(permission);
}

export function assertPermission(
  role: AdminRole,
  permission: AdminPermission,
): void {
  if (!hasPermission(role, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
