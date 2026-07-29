import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin/dal";
import { listInventoryMovements } from "@/lib/commerce/inventory-service";
import styles from "../../admin-pages.module.css";

export const metadata: Metadata = {
  title: "Inventory history",
};

export default async function AdminInventoryHistoryPage() {
  await requireAdminSession("inventory:read");
  const movements = await listInventoryMovements({ take: 100 });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Inventory history</h1>
        <p>Append-only ledger of stock movements and recounts.</p>
      </header>

      <section className={styles.panel}>
        {movements.length === 0 ? (
          <p className={styles.empty}>No inventory movements yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">SKU</th>
                <th scope="col">Variant</th>
                <th scope="col">Delta</th>
                <th scope="col">Before</th>
                <th scope="col">After</th>
                <th scope="col">Reason</th>
                <th scope="col">By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td>
                    {new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(movement.createdAt)}
                  </td>
                  <td>{movement.inventoryItem.variant.sku}</td>
                  <td>
                    {movement.inventoryItem.variant.colourValue.label} /{" "}
                    {movement.inventoryItem.variant.sizeValue.label}
                  </td>
                  <td>{movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta}</td>
                  <td>{movement.quantityBefore}</td>
                  <td>{movement.quantityAfter}</td>
                  <td>{movement.reasonCode.replaceAll("_", " ")}</td>
                  <td>
                    {movement.administrator?.email ??
                      movement.administrator?.name ??
                      "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
