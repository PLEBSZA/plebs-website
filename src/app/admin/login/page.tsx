import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import styles from "@/components/admin/LoginForm.module.css";
import { getAdminSession } from "@/lib/admin/dal";
import { auth } from "@/auth";
import { isCustomerRole } from "@/lib/account/roles";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }
  const authSession = await auth();
  if (isCustomerRole(authSession?.user?.role)) {
    redirect("/account/");
  }

  return (
    <div className={styles.page}>
      <LoginForm />
    </div>
  );
}
