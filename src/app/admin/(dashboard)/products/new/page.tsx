import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/dal";
import { CreateProductForm } from "./CreateProductForm";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Add product",
};

export default async function AdminCreateProductPage() {
  await requireAdminSession("products:write");

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Add product</h1>
        <p>
          Create a new parent garment (e.g. denim dungarees). Starts as draft
          with colour/size options; add a launch colour to create variants and
          inventory in one step.
        </p>
        <p style={{ marginTop: "0.25rem" }}>
          <Link href="/admin/products">← All products</Link>
        </p>
      </header>

      <CreateProductForm />
    </>
  );
}
