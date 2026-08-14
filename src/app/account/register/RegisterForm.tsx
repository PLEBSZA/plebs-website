"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CONSENT_WORDING } from "@/lib/account/consent";
import {
  registerAccountAction,
  type AccountFormState,
} from "@/app/account/actions";
import styles from "../account.module.css";

const initial: AccountFormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAccountAction, initial);
  return (
    <form className={styles.card} action={action} noValidate>
      <div>
        <h1>Create account</h1>
        <p>{CONSENT_WORDING.ACCOUNT_REGISTER.text}</p>
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.message ? <p className={styles.success}>{state.message}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Sending…" : "Create account"}
      </button>
      <p>
        Already have an account?{" "}
        <Link href="/account/login/" className={styles.link}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
