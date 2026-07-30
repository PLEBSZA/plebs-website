import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/dal";

export const metadata: Metadata = {
  title: "Returns & exchanges",
};

/** Canonical list lives at /admin/orders?view=returns (PLEBS-ORDERS-004). */
export default async function AdminReturnsPage() {
  await requireAdminSession("returns:manage");
  redirect("/admin/orders?view=returns");
}
