"use client";

import { useActionState } from "react";
import {
  updateReturnStatusAction,
  type ReturnActionState,
} from "@/app/admin/actions/returns";
const RETURN_STATUSES = [
  "REQUESTED", "APPROVED", "REJECTED", "AWAITING_RETURN", "RECEIVED",
  "INSPECTING", "ACCEPTED", "EXCHANGE_PENDING", "EXCHANGE_SENT",
  "REFUND_PENDING", "REFUNDED", "CLOSED",
] as const;

const RETURN_DISPOSITIONS = [
  "SELLABLE_STOCK", "QUARANTINE", "DAMAGED", "SAMPLE", "DISCARD",
] as const;

const initialState: ReturnActionState = {};

export function ReturnStatusForm({
  returnId,
  currentStatus,
}: {
  returnId: string;
  currentStatus: string;
}) {
  const [state, action, pending] = useActionState(
    updateReturnStatusAction,
    initialState,
  );

  return (
    <form action={action}>
      <input type="hidden" name="returnId" value={returnId} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem", width: "12rem" }}>
              <label htmlFor="status">Status</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <select id="status" name="status" defaultValue={currentStatus}>
                {RETURN_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="disposition">Disposition</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <select id="disposition" name="disposition" defaultValue="">
                <option value="">—</option>
                {RETURN_DISPOSITIONS.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="returnTracking">Return tracking</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="returnTracking" name="returnTracking" style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="inspectionOutcome">Inspection outcome</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <textarea id="inspectionOutcome" name="inspectionOutcome" rows={2} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="internalNotes">Internal notes</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <textarea id="internalNotes" name="internalNotes" rows={2} style={{ width: "100%" }} />
            </td>
          </tr>
        </tbody>
      </table>

      {state.error && (
        <p style={{ color: "var(--color-error, crimson)", marginTop: "0.5rem" }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p style={{ color: "var(--color-success, green)", marginTop: "0.5rem" }}>
          Return status updated.
        </p>
      )}

      <button type="submit" disabled={pending} style={{ marginTop: "var(--space-3)" }}>
        {pending ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}
