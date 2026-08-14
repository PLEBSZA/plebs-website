"use client";

import { useActionState } from "react";
import {
  adminRunMaintenanceNowAction,
  type MaintenanceFormState,
} from "@/app/admin/actions/customers";
import styles from "./admin-pages.module.css";

const initial: MaintenanceFormState = {};

export function RunMaintenanceNow() {
  const [state, action, pending] = useActionState(
    adminRunMaintenanceNowAction,
    initial,
  );

  return (
    <section className={styles.panel} aria-label="Maintenance">
      <h2>Email and reservation recovery</h2>
      <p className={styles.empty}>
        Use this if a customer email did not send or stock stayed reserved after
        an abandoned checkout. Safe to run more than once.
      </p>
      <form action={action} className={styles.toolbar}>
        <button className={styles.button} type="submit" disabled={pending}>
          {pending ? "Running…" : "Run maintenance now"}
        </button>
      </form>
      {state.error ? <p className={styles.empty}>{state.error}</p> : null}
      {state.ok ? (
        <p>
          Processed {state.outboxProcessed} email jobs ({state.outboxSynced}{" "}
          sent, {state.outboxFailed} retrying) and released{" "}
          {state.reservationsReleased} expired reservations.
        </p>
      ) : null}
    </section>
  );
}
