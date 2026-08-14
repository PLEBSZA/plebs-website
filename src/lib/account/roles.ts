export const ADMIN_ROLES = [
  "OWNER",
  "OPERATIONS_ADMIN",
  "FULFILMENT_USER",
  "CONTENT_EDITOR",
] as const;

export type StaffRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(
  role: string | null | undefined,
): role is StaffRole {
  return (
    role === "OWNER" ||
    role === "OPERATIONS_ADMIN" ||
    role === "FULFILMENT_USER" ||
    role === "CONTENT_EDITOR"
  );
}

export function isCustomerRole(role: string | null | undefined): boolean {
  return role === "CUSTOMER";
}
