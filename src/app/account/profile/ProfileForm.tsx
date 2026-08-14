"use client";

import { useActionState } from "react";
import { updateProfileAction, type AccountFormState } from "@/app/account/actions";
import styles from "../account.module.css";

export function ProfileForm({
  firstName,
  lastName,
  phone,
}: {
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, {} as AccountFormState);
  return (
    <form action={action} className={styles.panel}>
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label htmlFor="firstName">First name</label>
          <input id="firstName" name="firstName" defaultValue={firstName} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" name="lastName" defaultValue={lastName} required />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" defaultValue={phone} autoComplete="tel" />
      </div>
      {state.message ? <p className={styles.success}>{state.message}</p> : null}
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
