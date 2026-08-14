export const ACCOUNT_NAV_ITEMS = [
  { href: "/account/", label: "Overview" },
  { href: "/account/orders/", label: "Orders" },
  { href: "/account/profile/", label: "Profile" },
  { href: "/account/addresses/", label: "Addresses" },
  { href: "/account/preferences/", label: "Email preferences" },
] as const;

export const ACCOUNT_ORDERS_PAGE_SIZE = 20;

export function normalizeAccountPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isAccountNavActive(pathname: string, href: string): boolean {
  const path = normalizeAccountPath(pathname);
  const target = normalizeAccountPath(href);
  if (target === "/account") return path === "/account";
  return path === target || path.startsWith(`${target}/`);
}

export function parseAccountOrdersPage(raw: unknown): number {
  const value =
    typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
  if (!Number.isInteger(value) || value < 1) return 1;
  return Math.min(value, 500);
}

export function formatAccountDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}

export function friendlyPaymentStatus(status: string): string {
  switch (status) {
    case "PENDING":
      return "Awaiting payment";
    case "AUTHORISED":
      return "Payment authorised";
    case "PAID":
      return "Paid";
    case "PARTIALLY_REFUNDED":
      return "Partially refunded";
    case "REFUNDED":
      return "Refunded";
    case "FAILED":
      return "Payment unsuccessful";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Payment update";
  }
}

export function friendlyFulfilmentStatus(status: string): string {
  switch (status) {
    case "UNFULFILLED":
    case "PROCESSING":
      return "Processing";
    case "PACKED":
      return "Packed";
    case "FULFILLED":
      return "Dispatched";
    case "PARTIALLY_FULFILLED":
      return "Partially dispatched";
    case "DELIVERED":
      return "Delivered";
    case "RETURNED":
      return "Returned";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Fulfilment update";
  }
}

export function friendlyNewsletterStatus(status: string | null | undefined): string {
  switch (status) {
    case "OPTED_IN":
      return "Subscribed";
    case "PENDING_CONFIRMATION":
      return "Confirmation pending";
    case "SUPPRESSED":
      return "Suppressed";
    default:
      return "Not subscribed";
  }
}

export function friendlyRestockStatus(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Waiting for stock";
    case "NOTIFIED":
      return "Notified";
    case "CONVERTED":
      return "Purchased";
    case "EXPIRED":
      return "Expired";
    case "UNSUBSCRIBED":
      return "Unsubscribed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Restock update";
  }
}

export function friendlyReturnStatus(status: string): string {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) =>
    letter.toUpperCase(),
  );
}

export function safeExternalHttpUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
