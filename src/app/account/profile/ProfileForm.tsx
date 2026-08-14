"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateProfileAction, type AccountFormState } from "@/app/account/actions";
import styles from "../account.module.css";

function firstError(state: AccountFormState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function ProfileForm({
  email,
  firstName,
  lastName,
  phone,
}: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    {} as AccountFormState,
  );

  return (
    <section className={styles.panel}>
      <form action={action} className={styles.formPanel}>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            readOnly
            autoComplete="email"
          />
          <p className={styles.formHelp}>
            Your email cannot currently be changed here. Use password recovery if
            you need help accessing this account.
          </p>
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              defaultValue={firstName}
              autoComplete="given-name"
              required
            />
            {firstError(state, "firstName") ? (
              <p className={styles.error}>{firstError(state, "firstName")}</p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              defaultValue={lastName}
              autoComplete="family-name"
              required
            />
            {firstError(state, "lastName") ? (
              <p className={styles.error}>{firstError(state, "lastName")}</p>
            ) : null}
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            autoComplete="tel"
          />
          {firstError(state, "phone") ? (
            <p className={styles.error}>{firstError(state, "phone")}</p>
          ) : null}
        </div>
        <p className={styles.formHelp}>
          Need to change your password?{" "}
          <Link href="/account/forgot-password/" className={styles.link}>
            Use password recovery
          </Link>
          .
        </p>
        <div className={styles.formStatus} aria-live="polite">
          {state.message ? <p className={styles.success}>{state.message}</p> : null}
          {state.error ? <p className={styles.error}>{state.error}</p> : null}
        </div>
        <div className={styles.formActions}>
          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
