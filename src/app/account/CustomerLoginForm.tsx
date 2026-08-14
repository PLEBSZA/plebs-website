"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  customerLoginAction,
  type AccountFormState,
} from "@/app/account/actions";
import styles from "./account.module.css";

const initial: AccountFormState = {};

export function CustomerLoginForm({
  callbackUrl,
  notice,
}: {
  callbackUrl?: string;
  notice?: string;
}) {
  const [state, action, pending] = useActionState(customerLoginAction, initial);

  return (
    <form className={styles.card} action={action} noValidate>
      <div>
        <h1>Sign in</h1>
        <p>Use the email from your order, newsletter or restock request.</p>
      </div>
      {notice ? <p className={styles.success}>{notice}</p> : null}
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/account/"} />
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
        {state.fieldErrors?.email ? (
          <p className={styles.error}>{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password ? (
          <p className={styles.error}>{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p>
        <Link href="/account/forgot-password/" className={styles.link}>
          Forgot password?
        </Link>
      </p>
      <p>
        New to Plebs?{" "}
        <Link href="/account/register/" className={styles.link}>
          Create account
        </Link>
      </p>
    </form>
  );
}
