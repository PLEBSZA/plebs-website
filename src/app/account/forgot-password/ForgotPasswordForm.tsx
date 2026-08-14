"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type AccountFormState } from "@/app/account/actions";
import styles from "../account.module.css";

const initial: AccountFormState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  return (
    <form className={styles.card} action={action} noValidate>
      <div>
        <h1>Reset password</h1>
        <p>
          Enter your email. If this address can be used with PLEBS, we will send
          the next step. Pending accounts receive a setup link; activated
          accounts receive a password reset. We will not say whether the email
          is registered.
        </p>
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.message ? <p className={styles.success}>{state.message}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
