"use client";

import { useActionState } from "react";
import {
  addColourAction,
  type ProductActionState,
} from "@/app/admin/actions/products";

type Props = {
  productId: string;
  sizeCodes: { code: string; label: string }[];
  currentPrice: number;
};

const initialState: ProductActionState = {};

export function AddColourForm({ productId, sizeCodes, currentPrice }: Props) {
  const [state, action, pending] = useActionState(addColourAction, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem", width: "12rem" }}>
              <label htmlFor="colourName">Colour name</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="colourName" name="colourName" required placeholder="Stone Beige" />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="colourCode">Code (2-6 chars)</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="colourCode" name="colourCode" required placeholder="STB" maxLength={6} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="hexReference">Hex reference</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="hexReference" name="hexReference" placeholder="#C4B89E" />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="retailPrice">Retail price (ZAR)</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input
                id="retailPrice"
                name="retailPrice"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={currentPrice || ""}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <fieldset style={{ border: "none", padding: 0, margin: "var(--space-3) 0" }}>
        <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
          Sizes and opening stock
        </legend>
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.4rem 0.5rem" }}>Include</th>
              <th style={{ textAlign: "left", padding: "0.4rem 0.5rem" }}>Size</th>
              <th style={{ textAlign: "left", padding: "0.4rem 0.5rem" }}>Opening qty</th>
            </tr>
          </thead>
          <tbody>
            {sizeCodes.map((size) => (
              <tr key={size.code}>
                <td style={{ padding: "0.4rem 0.5rem" }}>
                  <input
                    type="checkbox"
                    name="sizeCodes"
                    value={size.code}
                    defaultChecked
                  />
                </td>
                <td style={{ padding: "0.4rem 0.5rem" }}>{size.label}</td>
                <td style={{ padding: "0.4rem 0.5rem" }}>
                  <input
                    name={`stock_${size.code}`}
                    type="number"
                    min="0"
                    defaultValue="0"
                    style={{ width: "5rem" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </fieldset>

      {state.error && (
        <p style={{ color: "var(--color-error, crimson)" }}>{state.error}</p>
      )}
      {state.ok && (
        <p style={{ color: "var(--color-success, green)" }}>
          Colour added successfully. Variants created in DRAFT status.
        </p>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add colour"}
      </button>
    </form>
  );
}
