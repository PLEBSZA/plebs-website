import Link from "next/link";
import type { ReactNode } from "react";
import { productData } from "@/lib/product";
import styles from "@/app/account/account.module.css";

export function AccountPageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
      {children ? <div className={styles.lede}>{children}</div> : null}
    </header>
  );
}

export function AccountPanel({
  title,
  children,
  id,
}: {
  title?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className={styles.panel} id={id}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}

export function AccountEmptyState({
  title,
  children,
  actionHref = productData.path,
  actionLabel = "Shop dungarees",
}: {
  title: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className={styles.emptyState}>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyCopy}>{children}</p>
      <p>
        <Link href={actionHref} className={styles.submit}>
          {actionLabel}
        </Link>
      </p>
    </div>
  );
}

export function AccountStatusBadge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "pending" | "warning";
}) {
  const toneClass = {
    muted: styles.statusMuted,
    success: styles.statusSuccess,
    pending: styles.statusPending,
    warning: styles.statusWarning,
  }[tone];

  return <span className={`${styles.statusBadge} ${toneClass}`}>{children}</span>;
}

export function AccountDetailsList({
  items,
}: {
  items: Array<{
    term: string;
    value: ReactNode;
    href?: string;
    hrefLabel?: string;
  }>;
}) {
  return (
    <dl className={styles.detailsList}>
      {items.map((item) => (
        <div key={item.term} className={styles.detailsRow}>
          <dt className={styles.detailsTerm}>{item.term}</dt>
          <dd className={styles.detailsValue}>
            {item.value}
            {item.href ? (
              <>
                {" "}
                <Link href={item.href} className={styles.link}>
                  {item.hrefLabel ?? "Update"}
                </Link>
              </>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AccountFormActions({ children }: { children: ReactNode }) {
  return <div className={styles.formActions}>{children}</div>;
}

export function AccountLoadingState({
  message = "Loading your account…",
}: {
  message?: string;
}) {
  return (
    <div className={styles.loadingState} role="status" aria-live="polite">
      <p>{message}</p>
      <div className={styles.skeletonPanel} aria-hidden="true">
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
      </div>
    </div>
  );
}

export function AccountWorkspaceSkeleton() {
  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        <div className={styles.workspace}>
          <div className={styles.sidebar} aria-hidden="true">
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonNav} />
          </div>
          <div className={styles.content}>
            <AccountLoadingState />
          </div>
        </div>
      </div>
    </section>
  );
}

export function paymentBadgeTone(status: string) {
  if (status === "PAID" || status === "AUTHORISED") return "success" as const;
  if (status === "FAILED" || status === "CANCELLED") return "warning" as const;
  return "pending" as const;
}

export function fulfilmentBadgeTone(status: string) {
  if (status === "DELIVERED" || status === "FULFILLED") return "success" as const;
  if (status === "CANCELLED" || status === "RETURNED") return "warning" as const;
  return "pending" as const;
}

export function newsletterBadgeTone(status: string | null | undefined) {
  if (status === "OPTED_IN") return "success" as const;
  if (status === "PENDING_CONFIRMATION") return "pending" as const;
  if (status === "SUPPRESSED") return "warning" as const;
  return "muted" as const;
}
