import { AdminRole } from "@/generated/prisma/client";
import { isAdminRole } from "@/lib/account/roles";

export type AccountSnapshot = {
  customerId?: string | null;
  userId?: string | null;
  userRole?: AdminRole | string | null;
  passwordHash?: string | null;
  newsletterStatus?: string | null;
};

export function customerUserRoleForCreate(
  existingRole: string | null | undefined,
): AdminRole {
  if (existingRole && isAdminRole(existingRole)) {
    return existingRole as AdminRole;
  }
  return AdminRole.CUSTOMER;
}

export function shouldIssueSetupEmail(snapshot: AccountSnapshot): boolean {
  if (snapshot.userRole && isAdminRole(snapshot.userRole)) return false;
  return !snapshot.passwordHash;
}

export function shouldRecordNewsletterGrant(input: {
  explicitConsent: boolean;
  currentStatus?: string | null;
}): boolean {
  if (!input.explicitConsent) return false;
  return input.currentStatus !== "OPTED_IN" && input.currentStatus !== "PENDING_CONFIRMATION";
}

export function restockGrantsNewsletter(): false {
  return false;
}

export function replayedPaymentShouldProvision(newlyPaid: boolean): boolean {
  return newlyPaid;
}

export function recoveryOutboxEventType(snapshot: {
  active?: boolean | null;
  passwordHash?: string | null;
  userRole?: string | null;
}): "ACCOUNT_SETUP_EMAIL" | "PASSWORD_RESET_EMAIL" | null {
  if (snapshot.active === false) return null;
  if (snapshot.userRole && isAdminRole(snapshot.userRole)) return null;
  return snapshot.passwordHash ? "PASSWORD_RESET_EMAIL" : "ACCOUNT_SETUP_EMAIL";
}

function firstGrapheme(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return [...trimmed][0] ?? "";
}

export function accountMenuIdentity(input: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
}): { initials: string; givenName: string | null; menuLabel: string } {
  const nameParts = (input.name ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = (input.firstName ?? nameParts[0] ?? "").trim();
  const lastName = (
    input.lastName ?? (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "")
  ).trim();
  const email = (input.email ?? "").trim();
  const initials = (
    `${firstGrapheme(firstName)}${firstGrapheme(lastName)}` ||
    firstGrapheme(email) ||
    "?"
  ).toUpperCase();
  const givenName = firstName || null;
  return {
    initials,
    givenName,
    menuLabel: givenName
      ? `Open account menu for ${givenName}`
      : "Open account menu",
  };
}
