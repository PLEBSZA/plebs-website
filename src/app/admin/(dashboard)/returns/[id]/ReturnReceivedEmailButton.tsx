"use client";

import { useActionState } from "react";
import {
  sendReturnReceivedEmailAction,
  type ReturnActionState,
} from "@/app/admin/actions/returns";

const initial: ReturnActionState = {};

export function ReturnReceivedEmailButton({
  returnId,
  hasReceivedAt,
  priorSendCount,
  emailConfigured = true,
}: {
  returnId: string;
  hasReceivedAt: boolean;
  priorSendCount: number;
  emailConfigured?: boolean;
}) {
  const [state, action, pending] = useActionState(
    sendReturnReceivedEmailAction,
    initial,
  );

  if (!hasReceivedAt) {
    return (
      <p style={{ color: "var(--color-muted)" }}>
        Mark the return as received before sending the acknowledgement email.
      </p>
    );
  }

  return (
    <div>
      {priorSendCount === 0 ? (
        <form action={action}>
          <input type="hidden" name="returnId" value={returnId} />
          <button type="submit" disabled={pending || !emailConfigured}>
            {pending
              ? "Sending…"
              : emailConfigured
                ? "Send return-received email"
                : "Send return-received email (email not configured)"}
          </button>
        </form>
      ) : (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Re-send return-received email
          </summary>
          <form action={action} style={{ marginTop: "0.5rem" }}>
            <input type="hidden" name="returnId" value={returnId} />
            <label
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <input type="checkbox" name="confirmResend" value="yes" required />
              Confirm re-send
            </label>
            <button type="submit" disabled={pending || !emailConfigured}>
              {pending
                ? "Sending…"
                : emailConfigured
                  ? "Re-send return-received email"
                  : "Re-send return-received email (email not configured)"}
            </button>
          </form>
        </details>
      )}
      {state.error && (
        <p style={{ color: "crimson", margin: "0.25rem 0 0" }}>{state.error}</p>
      )}
      {state.warning && (
        <p style={{ color: "#a15c00", margin: "0.25rem 0 0" }}>{state.warning}</p>
      )}
      {state.ok && (
        <p style={{ color: "green", margin: "0.25rem 0 0" }}>
          {state.message ?? "Email sent ✓"}
        </p>
      )}
    </div>
  );
}
