"use client";

import { useActionState } from "react";
import {
  createBatchAction,
  type BatchActionState,
} from "@/app/admin/actions/batches";
import type { InventoryMatrix } from "@/lib/commerce/inventory-types";
import styles from "../admin-pages.module.css";

const initialState: BatchActionState = {};

export function CreateBatchForm({ matrix }: { matrix: InventoryMatrix }) {
  const [state, action, pending] = useActionState(createBatchAction, initialState);

  return (
    <form action={action} className={styles.panel}>
      <h2>Batch details</h2>
      <table className={styles.table}>
        <tbody>
          <tr>
            <th scope="row">
              <label htmlFor="batchNumber">Batch number</label>
            </th>
            <td>
              <input
                id="batchNumber"
                name="batchNumber"
                required
                placeholder="2026-09-FGR-01"
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="supplier">Supplier</label>
            </th>
            <td>
              <input id="supplier" name="supplier" />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="manufacturer">Manufacturer</label>
            </th>
            <td>
              <input id="manufacturer" name="manufacturer" />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="colourOrFabricLot">Colour / fabric lot</label>
            </th>
            <td>
              <input
                id="colourOrFabricLot"
                name="colourOrFabricLot"
                defaultValue="Forest Green"
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="expectedDeliveryDate">Expected delivery</label>
            </th>
            <td>
              <input
                id="expectedDeliveryDate"
                name="expectedDeliveryDate"
                type="date"
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="freightCost">Freight cost (ZAR)</label>
            </th>
            <td>
              <input id="freightCost" name="freightCost" type="number" min="0" step="0.01" />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="notes">Notes</label>
            </th>
            <td>
              <textarea id="notes" name="notes" rows={3} />
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Ordered quantities by size</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Colour</th>
            <th scope="col">Size</th>
            <th scope="col">SKU</th>
            <th scope="col">Ordered qty</th>
          </tr>
        </thead>
        <tbody>
          {matrix.cells.map((cell) => (
            <tr key={cell.variantId}>
              <td>{cell.colourLabel}</td>
              <td>{cell.sizeLabel}</td>
              <td>{cell.sku}</td>
              <td>
                <input
                  name={`qty_${cell.variantId}`}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={0}
                  aria-label={`Ordered quantity for ${cell.sku}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {state.error ? <p className={styles.empty}>{state.error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create batch"}
      </button>
    </form>
  );
}
