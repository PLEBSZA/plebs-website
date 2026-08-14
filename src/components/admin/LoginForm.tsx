"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions/auth";
import styles from "./LoginForm.module.css";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form className={styles.card} action={action} noValidate>
      <div>
        <h1>PLEBS Admin</h1>
        <p>Store staff sign in. Shopper accounts use the site Sign in, not this page.</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
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
    </form>
  );
}
