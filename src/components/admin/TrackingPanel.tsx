"use client";

import type { FormEvent, ReactNode } from "react";

export type TrackingPanelValues = {
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  note?: string | null;
};

type Props = {
  mode: "empty" | "editable" | "read-only";
  values?: TrackingPanelValues;
  /** Optional hidden fields rendered inside the form (e.g. exchangeId). */
  hiddenFields?: ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  pending?: boolean;
  error?: string;
  ok?: boolean;
  okMessage?: string;
  /** Extra actions below the save form (e.g. notify customer). */
  footer?: ReactNode;
  title?: string;
};

/**
 * Shared courier/tracking editor for order fulfilment and exchange outbound legs.
 * Modes: empty (before first capture), editable, read-only (cancelled).
 */
export function TrackingPanel({
  mode,
  values,
  hiddenFields,
  formAction,
  submitLabel = "Save tracking",
  pending = false,
  error,
  ok,
  okMessage = "Saved ✓",
  footer,
  title = "Tracking",
}: Props) {
  const readOnly = mode === "read-only";
  const empty = mode === "empty";

  if (readOnly) {
    return (
      <div style={{ marginBottom: "var(--space-3)" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {empty && !values?.courier && !values?.trackingNumber ? (
          <p style={{ color: "var(--color-muted)", margin: 0 }}>
            No tracking captured yet
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <th scope="row" style={{ textAlign: "left", padding: "0.25rem 0.5rem 0.25rem 0" }}>
                  Courier
                </th>
                <td>{values?.courier ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row" style={{ textAlign: "left", padding: "0.25rem 0.5rem 0.25rem 0" }}>
                  Tracking number
                </th>
                <td>
                  {values?.trackingUrl && values.trackingNumber ? (
                    <a
                      href={values.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {values.trackingNumber}
                    </a>
                  ) : (
                    values?.trackingNumber ?? "—"
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row" style={{ textAlign: "left", padding: "0.25rem 0.5rem 0.25rem 0" }}>
                  Tracking URL
                </th>
                <td>{values?.trackingUrl ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        )}
        {footer}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "var(--space-3)" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {empty && !values?.courier && !values?.trackingNumber ? (
        <p style={{ color: "var(--color-muted)", margin: "0 0 0.5rem" }}>
          No tracking captured yet
        </p>
      ) : null}
      {formAction ? (
        <form
          action={formAction}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            // Allow the browser to submit; no client-side interception.
            void event;
          }}
        >
          {hiddenFields}
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
              defaultValue={values?.courier ?? ""}
              style={{ flex: 1, minWidth: "10rem" }}
            />
            <input
              name="trackingNumber"
              placeholder="Tracking number"
              required
              defaultValue={values?.trackingNumber ?? ""}
              style={{ flex: 1, minWidth: "10rem" }}
            />
            <input
              name="trackingUrl"
              placeholder="Tracking URL (optional)"
              defaultValue={values?.trackingUrl ?? ""}
              style={{ flex: 1, minWidth: "10rem" }}
            />
          </div>
          <input
            name="note"
            placeholder="Internal note (optional)"
            defaultValue={values?.note ?? ""}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <button type="submit" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </button>
        </form>
      ) : null}
      {error && (
        <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>{error}</p>
      )}
      {ok && (
        <p style={{ color: "green", margin: "0.25rem 0 0" }}>{okMessage}</p>
      )}
      {footer}
    </div>
  );
}
