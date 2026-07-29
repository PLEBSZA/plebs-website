"use client";

import { useActionState } from "react";
import {
  updateVariantStatusAction,
  type ProductActionState,
} from "@/app/admin/actions/products";
const VARIANT_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;

type VariantRow = {
  id: string;
  sku: string;
  colour: string;
  size: string;
  status: string;
  price: string;
  onHand: number;
  reserved: number;
};

const initialState: ProductActionState = {};

function StatusForm({ variantId, current }: { variantId: string; current: string }) {
  const [state, action, pending] = useActionState(
    updateVariantStatusAction,
    initialState,
  );

  return (
    <form action={action} style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
      <input type="hidden" name="variantId" value={variantId} />
      <select name="status" defaultValue={current} style={{ fontSize: "0.8rem" }}>
        {VARIANT_STATUSES.map((value) => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>
      <button type="submit" disabled={pending} style={{ fontSize: "0.75rem" }}>
        {pending ? "…" : "Set"}
      </button>
      {state.error && <span style={{ color: "crimson", fontSize: "0.75rem" }}>{state.error}</span>}
    </form>
  );
}

export function VariantTable({ variants }: { variants: VariantRow[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "0.5rem" }}>SKU</th>
          <th style={{ textAlign: "left", padding: "0.5rem" }}>Colour</th>
          <th style={{ textAlign: "left", padding: "0.5rem" }}>Size</th>
          <th style={{ textAlign: "left", padding: "0.5rem" }}>Price</th>
          <th style={{ textAlign: "right", padding: "0.5rem" }}>On hand</th>
          <th style={{ textAlign: "right", padding: "0.5rem" }}>Reserved</th>
          <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {variants.map((variant) => (
          <tr key={variant.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
            <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{variant.sku}</td>
            <td style={{ padding: "0.5rem" }}>{variant.colour}</td>
            <td style={{ padding: "0.5rem" }}>{variant.size}</td>
            <td style={{ padding: "0.5rem" }}>{variant.price}</td>
            <td style={{ padding: "0.5rem", textAlign: "right" }}>{variant.onHand}</td>
            <td style={{ padding: "0.5rem", textAlign: "right" }}>{variant.reserved}</td>
            <td style={{ padding: "0.5rem" }}>
              <StatusForm variantId={variant.id} current={variant.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
