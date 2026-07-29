import Link from "next/link";
import { logoutAction } from "@/app/admin/actions/auth";
import { adminNavItems } from "@/lib/admin/navigation";
import { hasPermission } from "@/lib/admin/permissions";
import type { AdminSessionUser } from "@/lib/admin/dal";
import styles from "./AdminShell.module.css";

type AdminShellProps = {
  user: AdminSessionUser;
  pathname: string;
  children: React.ReactNode;
};

export function AdminShell({ user, pathname, children }: AdminShellProps) {
  const items = adminNavItems.filter((item) =>
    hasPermission(user.role, item.permission),
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          PLEBS
          <span>Admin</span>
        </Link>
        <nav className={styles.nav} aria-label="Admin">
          {items.map((item) => {
            const current =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.userBlock}>
          <div className={styles.userMeta}>
            <strong>{user.name ?? "Administrator"}</strong>
            <span>{user.email}</span>
            <span>{user.role.replaceAll("_", " ")}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutButton}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
