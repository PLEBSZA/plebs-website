import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin/dal";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdminSession();
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/admin";

  return (
    <AdminShell user={user} pathname={pathname}>
      {children}
    </AdminShell>
  );
}
