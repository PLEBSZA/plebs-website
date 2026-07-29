"use client";

import { useActionState } from "react";
import {
  updateProductAction,
  type ProductActionState,
} from "@/app/admin/actions/products";
const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const PUBLICATION_STATUSES = ["UNPUBLISHED", "STOREFRONT", "PRODUCT_FEED", "STOREFRONT_AND_FEED"] as const;
const FEED_STATUSES = ["UNPUBLISHED", "PUBLISHED", "EXCLUDED"] as const;

type Props = {
  product: {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    status: string;
    publicationStatus: string;
    feedPublicationStatus: string;
    mainMaterial: string;
    fitSummary: string;
    careSummary: string;
    countryOfDesign: string;
    countryOfManufacture: string;
    seoTitle: string;
    metaDescription: string;
    googleProductCategory: string;
  };
};

const initialState: ProductActionState = {};

export function ProductEditorForm({ product }: Props) {
  const [state, action, pending] = useActionState(
    updateProductAction,
    initialState,
  );

  return (
    <form action={action}>
      <input type="hidden" name="productId" value={product.id} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem", width: "12rem" }}>
              <label htmlFor="name">Name</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="name" name="name" defaultValue={product.name} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="shortDescription">Short description</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="shortDescription" name="shortDescription" defaultValue={product.shortDescription} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="description">Description</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <textarea id="description" name="description" defaultValue={product.description} rows={4} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="status">Status</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <select id="status" name="status" defaultValue={product.status}>
                {PRODUCT_STATUSES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="publicationStatus">Publication</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <select id="publicationStatus" name="publicationStatus" defaultValue={product.publicationStatus}>
                {PUBLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="feedPublicationStatus">Feed status</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <select id="feedPublicationStatus" name="feedPublicationStatus" defaultValue={product.feedPublicationStatus}>
                {FEED_STATUSES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="mainMaterial">Main material</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="mainMaterial" name="mainMaterial" defaultValue={product.mainMaterial} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="fitSummary">Fit summary</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="fitSummary" name="fitSummary" defaultValue={product.fitSummary} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="countryOfDesign">Country of design</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="countryOfDesign" name="countryOfDesign" defaultValue={product.countryOfDesign} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="countryOfManufacture">Country of manufacture</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="countryOfManufacture" name="countryOfManufacture" defaultValue={product.countryOfManufacture} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="seoTitle">SEO title</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="seoTitle" name="seoTitle" defaultValue={product.seoTitle} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="metaDescription">Meta description</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <textarea id="metaDescription" name="metaDescription" defaultValue={product.metaDescription} rows={2} style={{ width: "100%" }} />
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>
              <label htmlFor="googleProductCategory">Google product category</label>
            </th>
            <td style={{ padding: "0.5rem" }}>
              <input id="googleProductCategory" name="googleProductCategory" defaultValue={product.googleProductCategory} style={{ width: "100%" }} />
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
          Product updated.
        </p>
      )}

      <button type="submit" disabled={pending} style={{ marginTop: "var(--space-3)" }}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
