import type { Metadata } from "next";
import { CreateBatchForm } from "@/app/admin/(dashboard)/batches/CreateBatchForm";
import { requireAdminSession } from "@/lib/admin/dal";
import { getInventoryMatrix } from "@/lib/commerce/inventory-service";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Create batch",
};

export default async function AdminCreateBatchPage() {
  await requireAdminSession("inventory:write");
  const matrix = await getInventoryMatrix();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Create production batch</h1>
        <p>
          Enter ordered quantities by variant. Incoming stock is increased when
          the batch is created, and only accepted units become sellable on
          receipt.
        </p>
      </header>
      <CreateBatchForm matrix={matrix} />
    </>
  );
}
