"use client";

import { useEffect, useRef } from "react";
import {
  consumePendingPurchase,
  emitAnalytics,
} from "@/lib/analytics/emit";
import {
  shouldClearCartOnConfirmation,
  shouldEmitPurchaseAnalytics,
} from "@/lib/checkout/confirmation";

type PurchaseBeaconProps = {
  orderNumber: string | null;
  paid: boolean;
};

/**
 * Fires a one-shot GA4 purchase event after a successful Paystack return.
 * Order totals are restored from sessionStorage (stashed at Pay Now).
 */
export function PurchaseBeacon({ orderNumber, paid }: PurchaseBeaconProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (
      !shouldEmitPurchaseAnalytics(paid) ||
      !shouldClearCartOnConfirmation(paid) ||
      !orderNumber ||
      fired.current
    ) {
      return;
    }

    const pending = consumePendingPurchase();
    fired.current = true;

    emitAnalytics({
      event: "purchase",
      path: window.location.pathname,
      transaction_id: orderNumber,
      ecommerce: pending
        ? {
            transaction_id: pending.transaction_id,
            currency: pending.currency,
            value: pending.value,
            items: pending.items,
          }
        : {
            transaction_id: orderNumber,
          },
    });
    window.dispatchEvent(new Event("plebs:clear-cart"));
  }, [paid, orderNumber]);

  return null;
}
