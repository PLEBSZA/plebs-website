"use client";

import { useActionState } from "react";
import type { AccountFormState } from "@/app/account/actions";
import styles from "./account.module.css";

export function PasswordTokenForm({
  action,
  title,
  token,
  submitLabel,
}: {
  action: (
    state: AccountFormState,
    formData: FormData,
  ) => Promise<AccountFormState>;
  title: string;
  token: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form className={styles.card} action={formAction} noValidate>
      <div>
        <h1>{title}</h1>
        <p>Choose a password of at least 8 characters.</p>
      </div>
      <input type="hidden" name="token" value={token} />
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
