"use client";

import { useActionState } from "react";
import {
  receiveBatchAction,
  type BatchActionState,
} from "@/app/admin/actions/batches";
import styles from "../admin-pages.module.css";

type ReceiveLine = {
  id: string;
  sizeLabel: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRejected: number;
  quantityAccepted: number;
};

const initialState: BatchActionState = {};

export function ReceiveBatchForm({
  batchId,
  lines,
}: {
  batchId: string;
  lines: ReceiveLine[];
}) {
  const [state, action, pending] = useActionState(
    receiveBatchAction,
    initialState,
  );

  return (
    <form action={action} className={styles.panel}>
      <input type="hidden" name="batchId" value={batchId} />
      <h2>Receive stock</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">SKU</th>
            <th scope="col">Ordered</th>
            <th scope="col">Received</th>
            <th scope="col">Rejected</th>
            <th scope="col">Previously accepted</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td>
                {line.sizeLabel}
                <input type="hidden" name="lineItemId" value={line.id} />
              </td>
              <td>{line.sku}</td>
              <td>{line.quantityOrdered}</td>
              <td>
                <input
                  name={`received_${line.id}`}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={line.quantityReceived || line.quantityOrdered}
                  required
                />
              </td>
              <td>
                <input
                  name={`rejected_${line.id}`}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={line.quantityRejected}
                  required
                />
              </td>
              <td>{line.quantityAccepted}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <label>
        Note
        <br />
        <textarea name="note" rows={3} />
      </label>
      {state.error ? <p className={styles.empty}>{state.error}</p> : null}
      {state.ok ? <p className={styles.empty}>Batch receipt saved.</p> : null}
      <p>
        <button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Confirm receipt"}
        </button>
      </p>
    </form>
  );
}
