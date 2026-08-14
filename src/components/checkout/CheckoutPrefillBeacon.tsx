"use client";

import { useEffect } from "react";
import type { CheckoutPrefill } from "./CheckoutForm";

export function CheckoutPrefillBeacon({ prefill }: { prefill: CheckoutPrefill }) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("plebs:checkout-prefill", { detail: prefill }),
    );
  }, [prefill]);

  return null;
}
