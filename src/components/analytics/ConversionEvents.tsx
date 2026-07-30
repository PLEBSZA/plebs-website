"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStorefrontCatalogue } from "@/components/commerce/StorefrontCatalogueProvider";
import {
  emitAnalytics,
  type AnalyticsPayload,
} from "@/lib/analytics/emit";
import { buildAnalyticsItem } from "@/lib/product";
import type { StorefrontCatalogue } from "@/lib/commerce/storefront-types";

function ecommerceForEvent(
  catalogue: StorefrontCatalogue,
  eventName: string,
  variant?: {
    selected_size?: string;
    variant_sku?: string | null;
    colour?: string;
    quantity?: number;
  },
): Record<string, unknown> | undefined {
  const itemEvents = new Set([
    "view_item",
    "select_item",
    "add_to_cart",
    "remove_from_cart",
    "select_colour",
    "select_size",
    "begin_checkout",
    "add_payment_info",
    "purchase",
  ]);

  if (!itemEvents.has(eventName)) return undefined;

  const item = buildAnalyticsItem({
    catalogue,
    size: variant?.selected_size,
    sku: variant?.variant_sku,
    colour: variant?.colour,
    quantity: variant?.quantity,
  });
  return {
    currency: catalogue.currency,
    ...(catalogue.commerceEnabled && catalogue.price != null
      ? { value: catalogue.price * (variant?.quantity ?? 1) }
      : {}),
    items: [item],
  };
}

export function ConversionEvents() {
  const pathname = usePathname();
  const catalogue = useStorefrontCatalogue();

  useEffect(() => {
    const event = pathname.startsWith("/products/") ? "view_item" : "page_view";
    emitAnalytics({
      event,
      path: pathname,
      ecommerce: ecommerceForEvent(catalogue, event),
    });
  }, [pathname, catalogue]);

  useEffect(() => {
    function payloadFromElement(element: HTMLElement): AnalyticsPayload | null {
      const event = element.dataset.event;
      if (!event) return null;

      const input = element as HTMLInputElement | HTMLSelectElement;

      return {
        event,
        path: window.location.pathname,
        label:
          element.dataset.eventLabel ??
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 120),
        value: "value" in input ? input.value : undefined,
        selected_size: element.dataset.selectedSize,
        availability: element.dataset.availability,
        variant_sku: element.dataset.variantSku ?? null,
        colour: element.dataset.colour,
        ecommerce: ecommerceForEvent(catalogue, event, {
          selected_size: element.dataset.selectedSize,
          variant_sku: element.dataset.variantSku ?? null,
          colour: element.dataset.colour,
        }),
      };
    }

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const tracked = target?.closest<HTMLElement>("[data-event]");
      if (!tracked || tracked.matches("select, input, form")) return;

      const payload = payloadFromElement(tracked);
      if (payload) emitAnalytics(payload);
    }

    function onChange(event: Event) {
      const tracked = (event.target as Element | null)?.closest<HTMLElement>(
        "select[data-event], input[data-event]",
      );
      if (!tracked) return;

      const payload = payloadFromElement(tracked);
      if (payload) emitAnalytics(payload);
    }

    function onSubmit(event: SubmitEvent) {
      const tracked = (event.target as Element | null)?.closest<HTMLElement>(
        "form[data-event]",
      );
      if (!tracked) return;

      const payload = payloadFromElement(tracked);
      if (!payload) return;
      if (payload.event === "contact_form_submit") {
        payload.event = "contact_submit";
      }
      emitAnalytics(payload);
    }

    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("submit", onSubmit);

    function onCommerceEvent(event: Event) {
      const detail = (event as CustomEvent<Omit<AnalyticsPayload, "path">>)
        .detail;
      emitAnalytics({
        ...detail,
        path: window.location.pathname,
        ecommerce:
          detail.ecommerce ??
          ecommerceForEvent(catalogue, detail.event, detail),
      });
    }

    window.addEventListener("plebs:commerce-event", onCommerceEvent);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("change", onChange);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("plebs:commerce-event", onCommerceEvent);
    };
  }, [catalogue]);

  useEffect(() => {
    const viewed = new WeakSet<Element>();
    const elements = document.querySelectorAll<HTMLElement>("[data-view-event]");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || viewed.has(entry.target)) return;

          viewed.add(entry.target);
          const element = entry.target as HTMLElement;
          emitAnalytics({
            event: element.dataset.viewEvent ?? "content_view",
            path: window.location.pathname,
            label: element.dataset.eventLabel,
          });
          observer.unobserve(element);
        });
      },
      { threshold: 0.35 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
