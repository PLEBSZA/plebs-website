"use client";

import { useActionState } from "react";
import {
  packOrderAction,
  fulfilOrderAction,
  cancelOrderAction,
  markDeliveredAction,
  completeOrderAction,
  reopenOrderAction,
  updateTrackingAction,
  sendTrackingEmailAction,
  sendDeliveryEmailAction,
  resolveInventoryHoldAction,
  type FulfilmentActionState,
} from "@/app/admin/actions/fulfilment";
import {
  createReturnAction,
  type ReturnActionState,
} from "@/app/admin/actions/returns";
import { TrackingPanel } from "@/components/admin/TrackingPanel";

type Props = {
  orderId: string;
  status: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  inventoryHold?: boolean;
  completeBlocker: string | null;
  emailConfigured?: boolean;
  tracking?: {
    courier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    note?: string | null;
    customerNotifiedAt?: string | null;
    notifiedBy?: string | null;
    notificationCount: number;
  } | null;
  items: { id: string; sku: string; colour: string; size: string }[];
};

const initialFulfilment: FulfilmentActionState = {};
const initialReturn: ReturnActionState = {};

export function OrderActionsPanel({
  orderId,
  status,
  paymentStatus,
  fulfilmentStatus,
  inventoryHold = false,
  completeBlocker,
  emailConfigured = true,
  tracking,
  items,
}: Props) {
  const [holdState, holdAction, resolvingHold] = useActionState(
    resolveInventoryHoldAction,
    initialFulfilment,
  );
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
  const [deliveredState, deliveredAction, delivering] = useActionState(
    markDeliveredAction,
    initialFulfilment,
  );
  const [completeState, completeAction, completing] = useActionState(
    completeOrderAction,
    initialFulfilment,
  );
  const [reopenState, reopenAction, reopening] = useActionState(
    reopenOrderAction,
    initialFulfilment,
  );
  const [trackingState, trackingAction, savingTracking] = useActionState(
    updateTrackingAction,
    initialFulfilment,
  );
  const [emailState, emailAction, sendingEmail] = useActionState(
    sendTrackingEmailAction,
    initialFulfilment,
  );
  const [deliveryEmailState, deliveryEmailAction, sendingDeliveryEmail] =
    useActionState(sendDeliveryEmailAction, initialFulfilment);
  const [returnState, returnAction, returningPending] = useActionState(
    createReturnAction,
    initialReturn,
  );

  const isCancelled = status === "CANCELLED";
  const isCompleted = status === "COMPLETED";
  const isPaid = paymentStatus === "PAID";
  const isFulfilled = fulfilmentStatus === "FULFILLED";
  const isDelivered = fulfilmentStatus === "DELIVERED";
  const isPacked = fulfilmentStatus === "PACKED";
  const canCreateReturn =
    isFulfilled || isDelivered || fulfilmentStatus === "RETURNED";
  const hasDispatched = isFulfilled || isDelivered || fulfilmentStatus === "RETURNED";
  const trackingMode = isCancelled
    ? "read-only"
    : hasDispatched
      ? "editable"
      : "empty";
  const notificationCount = tracking?.notificationCount ?? 0;

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

      {inventoryHold && !isCancelled && (
        <div
          role="alert"
          style={{
            marginBottom: "var(--space-3)",
            padding: "var(--space-3)",
            border: "1px solid #a15c00",
            borderRadius: "var(--radius-sm)",
            background: "rgba(161, 92, 0, 0.08)",
          }}
        >
          <p style={{ margin: "0 0 0.5rem", fontWeight: 700, color: "#7a4300" }}>
            Inventory hold — do not pack
          </p>
          <p style={{ margin: "0 0 0.75rem" }}>
            This order was paid after its reservation expired and stock could
            not be re-reserved. Restock the size, then retry reservation before
            packing.
          </p>
          <form action={holdAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" disabled={resolvingHold}>
              {resolvingHold ? "Retrying…" : "Retry stock reservation"}
            </button>
          </form>
          {holdState.error && (
            <p style={{ color: "crimson", margin: "0.5rem 0 0" }}>
              {holdState.error}
            </p>
          )}
          {holdState.ok && (
            <p style={{ color: "green", margin: "0.5rem 0 0" }}>
              {holdState.message ?? "Hold cleared."}
            </p>
          )}
        </div>
      )}

      {!isCancelled && isPaid && !inventoryHold && !isPacked && !isFulfilled && !isDelivered && (
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

      {!isCancelled && isPaid && !inventoryHold && !hasDispatched && (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <form action={fulfilAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "0.5rem",
              }}
            >
              <input
                name="courier"
                placeholder="Courier name"
                required
                style={{ flex: 1, minWidth: "10rem" }}
              />
              <input
                name="trackingNumber"
                placeholder="Tracking number"
                required
                style={{ flex: 1, minWidth: "10rem" }}
              />
              <input
                name="trackingUrl"
                placeholder="Tracking URL (optional)"
                style={{ flex: 1, minWidth: "10rem" }}
              />
            </div>
            <input
              name="note"
              placeholder="Internal note (optional)"
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <button type="submit" disabled={fulfilling}>
              {fulfilling ? "Dispatching…" : "Mark as fulfilled"}
            </button>
          </form>
          {fulfilState.error && (
            <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
              {fulfilState.error}
            </p>
          )}
          {fulfilState.ok && (
            <p style={{ color: "green", margin: "0.25rem 0 0" }}>
              Dispatched ✓ — send the tracking email when ready.
            </p>
          )}
        </div>
      )}

      <TrackingPanel
        mode={trackingMode}
        title="Courier & tracking"
        values={tracking ?? undefined}
        formAction={trackingMode === "editable" ? trackingAction : undefined}
        pending={savingTracking}
        error={trackingState.error}
        ok={trackingState.ok}
        okMessage={trackingState.message ?? "Tracking saved ✓"}
        submitLabel="Save tracking"
        hiddenFields={
          <input type="hidden" name="orderId" value={orderId} />
        }
        footer={
          hasDispatched && !isCancelled ? (
            <div style={{ marginTop: "0.75rem" }}>
              {notificationCount > 0 && tracking?.customerNotifiedAt ? (
                <p style={{ color: "var(--color-muted)", margin: "0 0 0.5rem" }}>
                  Last notified{" "}
                  {new Intl.DateTimeFormat("en-ZA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(tracking.customerNotifiedAt))}
                  {tracking.notifiedBy ? ` by ${tracking.notifiedBy}` : ""}
                  {notificationCount > 1
                    ? ` · ${notificationCount} sends`
                    : ""}
                </p>
              ) : (
                <p style={{ color: "var(--color-muted)", margin: "0 0 0.5rem" }}>
                  Customer has not been emailed tracking yet.
                </p>
              )}
              {notificationCount === 0 ? (
                <form action={emailAction}>
                  <input type="hidden" name="orderId" value={orderId} />
                  <button
                    type="submit"
                    disabled={sendingEmail || !emailConfigured}
                    title={
                      emailConfigured
                        ? undefined
                        : "Email is not configured"
                    }
                  >
                    {sendingEmail
                      ? "Sending…"
                      : emailConfigured
                        ? "Send tracking email"
                        : "Send tracking email (email not configured)"}
                  </button>
                </form>
              ) : (
                <details>
                  <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                    Re-send tracking email
                  </summary>
                  <form action={emailAction} style={{ marginTop: "0.5rem" }}>
                    <input type="hidden" name="orderId" value={orderId} />
                    <label
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="confirmResend"
                        value="yes"
                        required
                      />
                      Confirm re-send with the current tracking details
                    </label>
                    <button
                      type="submit"
                      disabled={sendingEmail || !emailConfigured}
                      title={
                        emailConfigured
                          ? undefined
                          : "Email is not configured"
                      }
                    >
                      {sendingEmail
                        ? "Sending…"
                        : emailConfigured
                          ? "Re-send tracking email"
                          : "Re-send tracking email (email not configured)"}
                    </button>
                  </form>
                </details>
              )}
              {emailState.error && (
                <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
                  {emailState.error}
                </p>
              )}
              {emailState.warning && (
                <p style={{ color: "#a15c00", margin: "0.25rem 0 0" }}>
                  {emailState.warning}
                </p>
              )}
              {emailState.ok && (
                <p style={{ color: "green", margin: "0.25rem 0 0" }}>
                  {emailState.message ?? "Email sent ✓"}
                </p>
              )}
            </div>
          ) : null
        }
      />

      {!isCancelled && isFulfilled && (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <form action={deliveredAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "0.5rem",
              }}
            >
              <input
                name="deliveredAt"
                type="datetime-local"
                title="Optional backdated delivery time"
                style={{ flex: 1, minWidth: "12rem" }}
              />
              <input
                name="note"
                placeholder="Internal note (optional)"
                style={{ flex: 2, minWidth: "10rem" }}
              />
            </div>
            <button type="submit" disabled={delivering}>
              {delivering ? "Saving…" : "Mark delivered"}
            </button>
          </form>
          {deliveredState.error && (
            <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
              {deliveredState.error}
            </p>
          )}
          {deliveredState.ok && (
            <p style={{ color: "green", margin: "0.25rem 0 0" }}>
              Delivered ✓
            </p>
          )}
        </div>
      )}

      {!isCancelled && isDelivered && (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              Send delivery confirmation email
            </summary>
            <form action={deliveryEmailAction} style={{ marginTop: "0.5rem" }}>
              <input type="hidden" name="orderId" value={orderId} />
              <label
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <input
                  type="checkbox"
                  name="confirmResend"
                  value="yes"
                />
                Confirm send / re-send
              </label>
              <button
                type="submit"
                disabled={sendingDeliveryEmail || !emailConfigured}
                title={
                  emailConfigured ? undefined : "Email is not configured"
                }
              >
                {sendingDeliveryEmail
                  ? "Sending…"
                  : emailConfigured
                    ? "Send delivery email to customer"
                    : "Send delivery email (email not configured)"}
              </button>
            </form>
            {deliveryEmailState.error && (
              <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
                {deliveryEmailState.error}
              </p>
            )}
            {deliveryEmailState.warning && (
              <p style={{ color: "#a15c00", margin: "0.25rem 0 0" }}>
                {deliveryEmailState.warning}
              </p>
            )}
            {deliveryEmailState.ok && (
              <p style={{ color: "green", margin: "0.25rem 0 0" }}>
                {deliveryEmailState.message ?? "Email sent ✓"}
              </p>
            )}
          </details>
        </div>
      )}

      {!isCancelled && !isCompleted && (
        <div style={{ marginBottom: "var(--space-3)" }}>
          {completeBlocker ? (
            <p style={{ color: "var(--color-muted)", margin: 0 }}>
              Cannot mark complete: {completeBlocker}
            </p>
          ) : (
            <form action={completeAction} style={{ display: "inline" }}>
              <input type="hidden" name="orderId" value={orderId} />
              <button type="submit" disabled={completing}>
                {completing ? "Completing…" : "Mark complete"}
              </button>
            </form>
          )}
          {completeState.error && (
            <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
              {completeState.error}
            </p>
          )}
          {completeState.ok && (
            <p style={{ color: "green", margin: "0.25rem 0 0" }}>
              Completed ✓
            </p>
          )}
        </div>
      )}

      {!isCancelled && isCompleted && (
        <details style={{ marginBottom: "var(--space-3)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Reopen order
          </summary>
          <form action={reopenAction} style={{ marginTop: "0.5rem" }}>
            <input type="hidden" name="orderId" value={orderId} />
            <input
              name="reason"
              placeholder="Reason (required)"
              required
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <button type="submit" disabled={reopening}>
              {reopening ? "Reopening…" : "Reopen order"}
            </button>
          </form>
          {reopenState.error && (
            <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>
              {reopenState.error}
            </p>
          )}
          {reopenState.ok && (
            <p style={{ color: "green", margin: "0.25rem 0 0" }}>
              Order reopened.
            </p>
          )}
        </details>
      )}

      {!isCancelled && !hasDispatched && (
        <details style={{ marginBottom: "var(--space-3)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Cancel order
          </summary>
          <form action={cancelAction} style={{ marginTop: "0.5rem" }}>
            <input type="hidden" name="orderId" value={orderId} />
            <input
              name="reason"
              placeholder="Reason (optional)"
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <button
              type="submit"
              disabled={cancelling}
              style={{ color: "crimson" }}
            >
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

      {canCreateReturn && items.length > 0 && (
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
