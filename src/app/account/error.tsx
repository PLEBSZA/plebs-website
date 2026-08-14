"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./account.module.css";

export default function AccountError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[account] route failed", {
      digest: error.digest ?? null,
      name: error.name,
    });
  }, [error]);

  return (
    <section className={styles.panel} role="alert">
      <h1 className={styles.errorTitle}>We couldn’t load your account</h1>
      <p>
        Something went wrong while loading this page. Try again, or contact PLEBS
        if it keeps happening.
      </p>
      <div className={styles.formActions}>
        <button type="button" className={styles.submit} onClick={() => unstable_retry()}>
          Try again
        </button>
        <Link href="/contact/" className={styles.secondary}>
          Contact PLEBS
        </Link>
      </div>
    </section>
  );
}
