import type { Metadata } from "next";
import Link from "next/link";
import { InventoryMatrixPanel } from "@/components/admin/InventoryMatrix";
import { adminCan, requireAdminSession } from "@/lib/admin/dal";
import { listProductsForAdmin } from "@/lib/commerce/catalogue-service";
import { getInventoryMatrix } from "@/lib/commerce/inventory-service";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  await requireAdminSession("inventory:read");
  const { product: productId } = await searchParams;
  const products = await listProductsForAdmin();
  const selectedId =
    productId && products.some((product) => product.id === productId)
      ? productId
      : products[0]?.id;

  const [matrix, canAdjust] = await Promise.all([
    selectedId
      ? getInventoryMatrix(selectedId)
      : Promise.resolve(null),
    adminCan("inventory:write"),
  ]);

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Inventory matrix</h1>
        <p>
          Variant-level stock by colour and size. Available quantity is on hand
          minus reserved.
        </p>
      </header>

      {products.length > 1 && (
        <nav
          aria-label="Select product"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "var(--space-4)",
          }}
        >
          {products.map((product) => {
            const active = product.id === selectedId;
            return (
              <Link
                key={product.id}
                href={`/admin/inventory?product=${product.id}`}
                style={{
                  fontWeight: active ? 700 : 500,
                  textDecoration: active ? "underline" : "none",
                  color: "var(--color-forest-900)",
                }}
              >
                {product.name}
              </Link>
            );
          })}
        </nav>
      )}

      {matrix ? (
        <InventoryMatrixPanel matrix={matrix} canAdjust={canAdjust} />
      ) : (
        <section className={styles.panel}>
          <p className={styles.empty}>
            No products yet.{" "}
            <Link href="/admin/products/new">Add a product</Link> to manage
            inventory.
          </p>
        </section>
      )}
    </>
  );
}
