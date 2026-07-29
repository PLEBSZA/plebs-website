import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/dal";
import { listProductsForAdmin } from "@/lib/commerce/catalogue-service";
import { formatMoney } from "@/lib/money";
import styles from "../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminProductsPage() {
  await requireAdminSession("products:read");
  const products = await listProductsForAdmin();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Products</h1>
        <p>Parent garments and their active variant counts.</p>
        <p style={{ marginTop: "0.75rem" }}>
          <Link href="/admin/products/new">+ Add product</Link>
        </p>
      </header>
      <section className={styles.panel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Status</th>
              <th scope="col">Publication</th>
              <th scope="col">Active variants</th>
              <th scope="col">Available</th>
              <th scope="col">Price range</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No products yet.{" "}
                  <Link href="/admin/products/new">Add your first product</Link>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/admin/products/${product.id}`}>
                      {product.name}
                    </Link>
                  </td>
                  <td>{product.status}</td>
                  <td>{product.publicationStatus.replaceAll("_", " ")}</td>
                  <td>{product.activeVariantCount}</td>
                  <td>{product.totalAvailable}</td>
                  <td>
                    {product.priceMin == null
                      ? "—"
                      : product.priceMin === product.priceMax
                        ? formatMoney(product.priceMin, "ZAR")
                        : `${formatMoney(product.priceMin, "ZAR")} – ${formatMoney(product.priceMax ?? product.priceMin, "ZAR")}`}
                  </td>
                  <td>
                    {new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                    }).format(product.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
