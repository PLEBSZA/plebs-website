"use client";

import { useActionState } from "react";
import {
  packOrderAction,
  fulfilOrderAction,
  cancelOrderAction,
  type FulfilmentActionState,
} from "@/app/admin/actions/fulfilment";
import {
  createReturnAction,
  type ReturnActionState,
} from "@/app/admin/actions/returns";

type Props = {
  orderId: string;
  status: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  items: { id: string; sku: string; colour: string; size: string }[];
};

const initialFulfilment: FulfilmentActionState = {};
const initialReturn: ReturnActionState = {};

export function OrderActionsPanel({
  orderId,
  status,
  paymentStatus,
  fulfilmentStatus,
  items,
}: Props) {
  const [packState, packAction, packing] = useActionState(
    packOrderAction,
    initialFulfilment,
  );
  const [fulfilState, fulfilAction, fulfilling] = useActionState(
    fulfilOrderAction,
    initialFulfilment,
  );
  const [cancelState, cancelAction, cancelling] = useActionState(
    cancelOrderAction,
    initialFulfilment,
  );
  const [returnState, returnAction, returningPending] = useActionState(
    createReturnAction,
    initialReturn,
  );

  const isCancelled = status === "CANCELLED";
  const isPaid = paymentStatus === "PAID";
  const isFulfilled = fulfilmentStatus === "FULFILLED";
  const isPacked = fulfilmentStatus === "PACKED";

  return (
    <section
      style={{
        marginTop: "var(--space-5)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        background: "rgba(255,255,255,0.55)",
        padding: "var(--space-4)",
      }}
    >
      <h2>Actions</h2>

      {!isCancelled && isPaid && !isPacked && !isFulfilled && (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <form action={packAction} style={{ display: "inline" }}>
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" disabled={packing}>
              {packing ? "Packing…" : "Mark as packed"}
            </button>
          </form>
          {packState.error && (
            <span style={{ color: "crimson", marginLeft: "0.5rem" }}>
              {packState.error}
            </span>
          )}
          {packState.ok && (
            <span style={{ color: "green", marginLeft: "0.5rem" }}>Packed ✓</span>
          )}
        </div>
      )}

      {!isCancelled && isPaid && !isFulfilled && (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <form action={fulfilAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <input name="courier" placeholder="Courier name" required style={{ flex: 1, minWidth: "10rem" }} />
              <input name="trackingNumber" placeholder="Tracking number" required style={{ flex: 1, minWidth: "10rem" }} />
              <input name="trackingUrl" placeholder="Tracking URL (optional)" style={{ flex: 1, minWidth: "10rem" }} />
            </div>
            <input name="note" placeholder="Internal note (optional)" style={{ width: "100%", marginBottom: "0.5rem" }} />
            <button type="submit" disabled={fulfilling}>
              {fulfilling ? "Fulfilling…" : "Mark as fulfilled"}
            </button>
          </form>
          {fulfilState.error && (
            <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
              {fulfilState.error}
            </p>
          )}
          {fulfilState.ok && (
            <p style={{ color: "green", margin: "0.25rem 0 0" }}>
              Fulfilled ✓
            </p>
          )}
        </div>
      )}

      {!isCancelled && !isFulfilled && (
        <details style={{ marginBottom: "var(--space-3)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Cancel order</summary>
          <form action={cancelAction} style={{ marginTop: "0.5rem" }}>
            <input type="hidden" name="orderId" value={orderId} />
            <input name="reason" placeholder="Reason (optional)" style={{ width: "100%", marginBottom: "0.5rem" }} />
            <button type="submit" disabled={cancelling} style={{ color: "crimson" }}>
              {cancelling ? "Cancelling…" : "Cancel order"}
            </button>
          </form>
          {cancelState.error && (
            <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
              {cancelState.error}
            </p>
          )}
          {cancelState.ok && (
            <p style={{ color: "green", margin: "0.25rem 0 0" }}>
              Order cancelled.
            </p>
          )}
        </details>
      )}

      {isFulfilled && items.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Create return / exchange
          </summary>
          <form action={returnAction} style={{ marginTop: "0.5rem" }}>
            <input type="hidden" name="orderId" value={orderId} />
            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                Item{" "}
                <select name="orderItemId" required>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} – {item.colour} {item.size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <input
              name="reason"
              placeholder="Return reason"
              required
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              name="customerComments"
              placeholder="Customer comments (optional)"
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              name="replacementVariantId"
              placeholder="Replacement variant ID for exchange (optional)"
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <button type="submit" disabled={returningPending}>
              {returningPending ? "Creating…" : "Create return"}
            </button>
          </form>
          {returnState.error && (
            <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
              {returnState.error}
            </p>
          )}
          {returnState.ok && (
            <p style={{ color: "green", margin: "0.25rem 0 0" }}>
              Return created ✓
            </p>
          )}
        </details>
      )}

      {isCancelled && (
        <p style={{ color: "var(--color-muted)" }}>This order is cancelled.</p>
      )}
    </section>
  );
}
