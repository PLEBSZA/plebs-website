import { getGaMeasurementId } from "@/lib/analytics/config";

export type AnalyticsPayload = {
  event: string;
  path: string;
  label?: string;
  value?: string;
  ecommerce?: Record<string, unknown>;
  selected_size?: string;
  availability?: string;
  variant_sku?: string | null;
  colour?: string;
  quantity?: number;
  transaction_id?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ECOMMERCE_EVENTS = new Set([
  "view_item",
  "select_item",
  "add_to_cart",
  "remove_from_cart",
  "begin_checkout",
  "add_payment_info",
  "purchase",
]);

const pendingGaEvents: AnalyticsPayload[] = [];

function sendToGa(payload: AnalyticsPayload) {
  if (typeof window.gtag !== "function") return;
  if (!getGaMeasurementId()) return;

  if (payload.event === "page_view") {
    window.gtag("event", "page_view", {
      page_path: payload.path,
      page_location: window.location.href,
      page_title: document.title,
    });
    return;
  }

  if (GA_ECOMMERCE_EVENTS.has(payload.event)) {
    window.gtag("event", payload.event, {
      ...(payload.ecommerce ?? {}),
      ...(payload.transaction_id
        ? { transaction_id: payload.transaction_id }
        : {}),
    });
    return;
  }

  window.gtag("event", payload.event, {
    page_path: payload.path,
    event_label: payload.label,
    ...(payload.value ? { value: payload.value } : {}),
    ...(payload.selected_size ? { selected_size: payload.selected_size } : {}),
    ...(payload.availability ? { availability: payload.availability } : {}),
    ...(payload.variant_sku ? { variant_sku: payload.variant_sku } : {}),
    ...(payload.colour ? { colour: payload.colour } : {}),
    ...(payload.quantity != null ? { quantity: payload.quantity } : {}),
  });
}

/** Push to dataLayer and forward to GA4 when the tag is ready. */
export function emitAnalytics(payload: AnalyticsPayload) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
  window.dispatchEvent(
    new CustomEvent("plebs:analytics", { detail: payload }),
  );

  if (typeof window.gtag === "function") {
    sendToGa(payload);
  } else {
    pendingGaEvents.push(payload);
  }
}

/** Flush events that fired before gtag.js finished loading. */
export function flushPendingGaEvents() {
  if (typeof window.gtag !== "function") return;
  while (pendingGaEvents.length > 0) {
    const next = pendingGaEvents.shift();
    if (next) sendToGa(next);
  }
}

export const PENDING_PURCHASE_KEY = "plebs-pending-purchase";

export type PendingPurchase = {
  transaction_id: string;
  currency: string;
  value: number;
  items: Array<Record<string, unknown>>;
};

export function stashPendingPurchase(purchase: PendingPurchase) {
  try {
    window.sessionStorage.setItem(
      PENDING_PURCHASE_KEY,
      JSON.stringify(purchase),
    );
  } catch {
    // Ignore private-mode / storage failures.
  }
}

export function consumePendingPurchase(): PendingPurchase | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_PURCHASE_KEY);
    return JSON.parse(raw) as PendingPurchase;
  } catch {
    return null;
  }
}
