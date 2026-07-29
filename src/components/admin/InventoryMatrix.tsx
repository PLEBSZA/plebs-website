"use client";

import { useActionState, useId, useMemo, useState } from "react";
import {
  adjustInventoryAction,
  type InventoryActionState,
} from "@/app/admin/actions/inventory";
import type { InventoryMatrix } from "@/lib/commerce/inventory-types";
import { inventoryStatusLabel } from "@/lib/commerce/inventory-status";
import styles from "./InventoryMatrix.module.css";

type InventoryMatrixPanelProps = {
  matrix: InventoryMatrix;
  canAdjust: boolean;
};

const reasonOptions = [
  { value: "STOCK_RECOUNT", label: "Stock recount" },
  { value: "MANUAL_CORRECTION", label: "Manual correction" },
  { value: "OPENING_BALANCE", label: "Opening balance" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "SAMPLE_ALLOCATION", label: "Sample allocation" },
  { value: "PHOTOSHOOT_ALLOCATION", label: "Photoshoot allocation" },
] as const;

const initialState: InventoryActionState = {};

export function InventoryMatrixPanel({
  matrix,
  canAdjust,
}: InventoryMatrixPanelProps) {
  const titleId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [state, action, pending] = useActionState(
    async (
      prev: InventoryActionState,
      formData: FormData,
    ): Promise<InventoryActionState> => {
      const result = await adjustInventoryAction(prev, formData);
      if (result.ok) {
        setSelectedId(null);
      }
      return result;
    },
    initialState,
  );

  const selected = useMemo(
    () => matrix.cells.find((cell) => cell.inventoryLevelId === selectedId) ?? null,
    [matrix.cells, selectedId],
  );

  const lowStockCount = matrix.cells.filter((cell) => cell.status === "low_stock")
    .length;
  const outOfStockCount = matrix.cells.filter(
    (cell) => cell.status === "out_of_stock",
  ).length;
  const sizeS = matrix.cells.find((cell) => cell.sizeCode === "S");

  return (
    <div className={styles.grid}>
      <div className={styles.summary}>
        <div className={styles.card}>
          <span>Product</span>
          <strong>{matrix.productName}</strong>
        </div>
        <div className={styles.card}>
          <span>Size S available</span>
          <strong>{sizeS?.available ?? 0}</strong>
        </div>
        <div className={styles.card}>
          <span>Low stock</span>
          <strong>{lowStockCount}</strong>
        </div>
        <div className={styles.card}>
          <span>Out of stock</span>
          <strong>{outOfStockCount}</strong>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">
            Inventory matrix by colour and size
          </caption>
          <thead>
            <tr>
              <th scope="col">Colour / Size</th>
              {matrix.sizes.map((size) => (
                <th key={size.id} scope="col">
                  {size.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.colours.map((colour) => (
              <tr key={colour.id}>
                <th scope="row">{colour.label}</th>
                {matrix.sizes.map((size) => {
                  const cell = matrix.cells.find(
                    (entry) =>
                      entry.colourId === colour.id && entry.sizeId === size.id,
                  );
                  if (!cell) {
                    return (
                      <td key={size.id}>
                        <span className={styles.empty}>—</span>
                      </td>
                    );
                  }
                  return (
                    <td key={size.id}>
                      <button
                        type="button"
                        className={styles.cellButton}
                        data-status={cell.status}
                        onClick={() => setSelectedId(cell.inventoryLevelId)}
                        aria-label={`${colour.label} ${size.label}, ${cell.available} available, SKU ${cell.sku}`}
                      >
                        <span className={styles.available}>{cell.available}</span>
                        <span className={styles.meta}>
                          on hand {cell.onHand} · reserved {cell.reserved}
                        </span>
                        <span className={styles.meta}>
                          {inventoryStatusLabel(cell.status)}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.listFallback}>
        {matrix.cells.map((cell) => (
          <article key={cell.inventoryLevelId} className={styles.listCard}>
            <h2>
              {cell.colourLabel} / {cell.sizeLabel}
            </h2>
            <p>SKU {cell.sku}</p>
            <p>
              Available {cell.available} · On hand {cell.onHand} · Reserved{" "}
              {cell.reserved} · Incoming {cell.incoming}
            </p>
            <p>{inventoryStatusLabel(cell.status)}</p>
            <button
              type="button"
              onClick={() => setSelectedId(cell.inventoryLevelId)}
            >
              Adjust stock
            </button>
          </article>
        ))}
      </div>

      {selected ? (
        <div
          className={styles.drawerBackdrop}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelectedId(null);
          }}
        >
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header>
              <div>
                <h2 id={titleId}>
                  {selected.colourLabel} / {selected.sizeLabel}
                </h2>
                <p>
                  SKU {selected.sku} · Available {selected.available} · On hand{" "}
                  {selected.onHand} · Reserved {selected.reserved} · Incoming{" "}
                  {selected.incoming}
                </p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setSelectedId(null)}
              >
                Close
              </button>
            </header>

            {canAdjust ? (
              <form className={styles.form} action={action}>
                <input
                  type="hidden"
                  name="inventoryLevelId"
                  value={selected.inventoryLevelId}
                />
                <input
                  type="hidden"
                  name="expectedVersion"
                  value={selected.version}
                />

                <label>
                  Adjustment mode
                  <select name="mode" defaultValue="set" required>
                    <option value="set">Set exact counted quantity</option>
                    <option value="delta">Increase / decrease by amount</option>
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    name="quantity"
                    type="number"
                    inputMode="numeric"
                    required
                    defaultValue={selected.onHand}
                  />
                </label>

                <label>
                  Reason
                  <select name="reasonCode" defaultValue="STOCK_RECOUNT" required>
                    {reasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Note
                  <textarea
                    name="note"
                    placeholder="Optional context for the ledger"
                  />
                </label>

                {state.error ? <p className={styles.error}>{state.error}</p> : null}

                <button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Confirm adjustment"}
                </button>
              </form>
            ) : (
              <p>You can view stock details, but not adjust inventory.</p>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
