"use client";

import { useActionState } from "react";
import {
  createProductAction,
  type ProductActionState,
} from "@/app/admin/actions/products";
import styles from "../../admin-pages.module.css";

const DEFAULT_SIZES = [
  { code: "XS", label: "XS" },
  { code: "S", label: "S" },
  { code: "M", label: "M" },
  { code: "L", label: "L" },
  { code: "XL", label: "XL" },
] as const;

const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const PUBLICATION_STATUSES = [
  "UNPUBLISHED",
  "STOREFRONT",
  "PRODUCT_FEED",
  "STOREFRONT_AND_FEED",
] as const;

const initialState: ProductActionState = {};

export function CreateProductForm() {
  const [state, action, pending] = useActionState(
    createProductAction,
    initialState,
  );

  return (
    <form action={action} className={styles.panel}>
      <h2>Product identity</h2>
      <table className={styles.table}>
        <tbody>
          <tr>
            <th scope="row">
              <label htmlFor="name">Name</label>
            </th>
            <td>
              <input
                id="name"
                name="name"
                required
                placeholder="PLEBS Denim Dungarees"
                style={{ width: "100%" }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="internalName">Internal name</label>
            </th>
            <td>
              <input
                id="internalName"
                name="internalName"
                placeholder="Denim Dungarees"
                style={{ width: "100%" }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="slug">URL slug</label>
            </th>
            <td>
              <input
                id="slug"
                name="slug"
                placeholder="denim-dungarees"
                style={{ width: "100%" }}
              />
              <small style={{ color: "var(--color-muted)" }}>
                Leave blank to generate from the name.
              </small>
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="styleCode">Style code</label>
            </th>
            <td>
              <input
                id="styleCode"
                name="styleCode"
                required
                placeholder="D02"
                maxLength={8}
                style={{ width: "8rem" }}
              />
              <small style={{ display: "block", color: "var(--color-muted)" }}>
                Used in SKUs (PLB-D02-BLU-S) and item group (PLB-D02). Must be
                unique.
              </small>
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="brand">Brand</label>
            </th>
            <td>
              <input id="brand" name="brand" defaultValue="PLEBS" />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="productType">Product type</label>
            </th>
            <td>
              <input
                id="productType"
                name="productType"
                defaultValue="Dungarees"
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="category">Category</label>
            </th>
            <td>
              <input id="category" name="category" defaultValue="Apparel" />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="mainMaterial">Main material</label>
            </th>
            <td>
              <input
                id="mainMaterial"
                name="mainMaterial"
                placeholder="100% cotton denim"
                style={{ width: "100%" }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="shortDescription">Short description</label>
            </th>
            <td>
              <input
                id="shortDescription"
                name="shortDescription"
                style={{ width: "100%" }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="description">Description</label>
            </th>
            <td>
              <textarea
                id="description"
                name="description"
                rows={4}
                style={{ width: "100%" }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="status">Status</label>
            </th>
            <td>
              <select id="status" name="status" defaultValue="DRAFT">
                {PRODUCT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="publicationStatus">Publication</label>
            </th>
            <td>
              <select
                id="publicationStatus"
                name="publicationStatus"
                defaultValue="UNPUBLISHED"
              >
                {PUBLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: "var(--space-5)" }}>Sizes</h2>
      <p
        style={{
          color: "var(--color-charcoal-700)",
          marginBottom: "var(--space-3)",
        }}
      >
        Default alpha sizes match the corduroy dungarees. Uncheck any you do not
        need for this style.
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Include</th>
            <th scope="col">Size</th>
            <th scope="col">Opening stock (optional)</th>
          </tr>
        </thead>
        <tbody>
          {DEFAULT_SIZES.map((size) => (
            <tr key={size.code}>
              <td>
                <input
                  type="checkbox"
                  name="sizeCodes"
                  value={size.code}
                  defaultChecked
                />
                <input
                  type="hidden"
                  name={`sizeLabel_${size.code}`}
                  value={size.label}
                />
              </td>
              <td>{size.label}</td>
              <td>
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

      <h2 style={{ marginTop: "var(--space-5)" }}>Launch colour (optional)</h2>
      <p
        style={{
          color: "var(--color-charcoal-700)",
          marginBottom: "var(--space-3)",
        }}
      >
        Fill this in to create the first colour × size variants now. Leave blank
        to add colours later from the product editor.
      </p>
      <table className={styles.table}>
        <tbody>
          <tr>
            <th scope="row">
              <label htmlFor="colourName">Colour name</label>
            </th>
            <td>
              <input
                id="colourName"
                name="colourName"
                placeholder="Indigo"
                style={{ width: "100%" }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="colourCode">Colour code</label>
            </th>
            <td>
              <input
                id="colourCode"
                name="colourCode"
                placeholder="IND"
                maxLength={6}
                style={{ width: "8rem" }}
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="hexReference">Hex reference</label>
            </th>
            <td>
              <input
                id="hexReference"
                name="hexReference"
                placeholder="#3B4F7A"
              />
            </td>
          </tr>
          <tr>
            <th scope="row">
              <label htmlFor="retailPrice">Retail price (ZAR)</label>
            </th>
            <td>
              <input
                id="retailPrice"
                name="retailPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="799.99"
              />
            </td>
          </tr>
        </tbody>
      </table>

      {state.error && (
        <p style={{ color: "crimson", marginTop: "var(--space-3)" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ marginTop: "var(--space-4)" }}
      >
        {pending ? "Creating…" : "Create product"}
      </button>
    </form>
  );
}
