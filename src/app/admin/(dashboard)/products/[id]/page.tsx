import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/dal";
import { getProductForAdmin } from "@/lib/commerce/product-service";
import { formatMoney } from "@/lib/money";
import { ProductEditorForm } from "./ProductEditorForm";
import { AddColourForm } from "./AddColourForm";
import { VariantTable } from "./VariantTable";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Edit product",
};

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession("products:read");
  const { id } = await params;
  const product = await getProductForAdmin(id);

  if (!product) notFound();

  const canWrite = true;

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>{product.name}</h1>
        <p>
          {product.status} · {product.publicationStatus.replaceAll("_", " ")} ·{" "}
          {product.variants.length} variants
        </p>
        <p style={{ marginTop: "0.25rem" }}>
          <Link href="/admin/products">← All products</Link>
        </p>
      </header>

      {canWrite && (
        <section className={styles.panel} style={{ marginBottom: "var(--space-5)" }}>
          <h2>Product details</h2>
          <ProductEditorForm
            product={{
              id: product.id,
              name: product.name,
              description: product.description ?? "",
              shortDescription: product.shortDescription ?? "",
              status: product.status,
              publicationStatus: product.publicationStatus,
              feedPublicationStatus: product.feedPublicationStatus,
              mainMaterial: product.mainMaterial ?? "",
              fitSummary: product.fitSummary ?? "",
              careSummary: product.careSummary ?? "",
              countryOfDesign: product.countryOfDesign ?? "",
              countryOfManufacture: product.countryOfManufacture ?? "",
              seoTitle: product.seoTitle ?? "",
              metaDescription: product.metaDescription ?? "",
              googleProductCategory: product.googleProductCategory ?? "",
            }}
          />
        </section>
      )}

      <section className={styles.panel} style={{ marginBottom: "var(--space-5)" }}>
        <h2>Variants by colour</h2>
        <VariantTable
          variants={product.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            colour: variant.colourValue.label,
            size: variant.sizeValue.label,
            status: variant.status,
            price: formatMoney(Number(variant.retailPrice), "ZAR"),
            onHand: variant.inventoryItem?.levels[0]?.onHand ?? 0,
            reserved: variant.inventoryItem?.levels[0]?.reserved ?? 0,
          }))}
        />
      </section>

      {canWrite && (
        <section className={styles.panel}>
          <h2>Add a new colour</h2>
          <p style={{ color: "var(--color-charcoal-700)", marginBottom: "var(--space-3)" }}>
            Adds an option value, creates a variant per size, and initialises inventory.
          </p>
          <AddColourForm
            productId={product.id}
            sizeCodes={
              product.options
                .find((option) => option.code === "SIZE")
                ?.values.map((value) => ({ code: value.code, label: value.label })) ?? []
            }
            currentPrice={Number(product.variants[0]?.retailPrice ?? 0)}
          />
        </section>
      )}
    </>
  );
}
