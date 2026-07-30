"use client";

import { useActionState } from "react";
import {
  updateExchangeShipmentAction,
  markExchangeDeliveredAction,
  type ReturnActionState,
} from "@/app/admin/actions/returns";
import { TrackingPanel } from "@/components/admin/TrackingPanel";

type Props = {
  returnId: string;
  exchangeId: string;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  dispatchedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
};

const initial: ReturnActionState = {};

export function ExchangeShipmentPanel({
  returnId,
  exchangeId,
  courier,
  trackingNumber,
  trackingUrl,
  dispatchedAt,
  deliveredAt,
}: Props) {
  const [shipState, shipAction, shipping] = useActionState(
    updateExchangeShipmentAction,
    initial,
  );
  const [deliveredState, deliveredAction, delivering] = useActionState(
    markExchangeDeliveredAction,
    initial,
  );

  return (
    <section className="panel" style={{ marginTop: "var(--space-4)" }}>
      <h2>Outbound exchange shipment</h2>
      <p style={{ color: "var(--color-muted)", marginTop: 0 }}>
        Replacement garment going out to the customer (separate from inbound
        return tracking).
      </p>
      <TrackingPanel
        mode="editable"
        title="Replacement tracking"
        values={{ courier, trackingNumber, trackingUrl }}
        formAction={shipAction}
        pending={shipping}
        error={shipState.error}
        ok={shipState.ok}
        submitLabel={
          trackingNumber ? "Update replacement tracking" : "Save replacement tracking"
        }
        hiddenFields={
          <>
            <input type="hidden" name="exchangeId" value={exchangeId} />
            <input type="hidden" name="returnId" value={returnId} />
          </>
        }
        footer={
          dispatchedAt && !deliveredAt ? (
            <form action={deliveredAction} style={{ marginTop: "0.75rem" }}>
              <input type="hidden" name="exchangeId" value={exchangeId} />
              <input type="hidden" name="returnId" value={returnId} />
              <input
                name="deliveredAt"
                type="datetime-local"
                title="Optional backdated delivery time"
                style={{ marginRight: "0.5rem" }}
              />
              <button type="submit" disabled={delivering}>
                {delivering ? "Saving…" : "Mark replacement delivered"}
              </button>
              {deliveredState.error && (
                <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
                  {deliveredState.error}
                </p>
              )}
              {deliveredState.ok && (
                <p style={{ color: "green", margin: "0.25rem 0 0" }}>
                  Replacement delivered ✓
                </p>
              )}
            </form>
          ) : deliveredAt ? (
            <p style={{ color: "var(--color-muted)", margin: "0.75rem 0 0" }}>
              Replacement delivered{" "}
              {new Intl.DateTimeFormat("en-ZA", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(deliveredAt))}
            </p>
          ) : null
        }
      />
    </section>
  );
}
