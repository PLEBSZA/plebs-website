"use client";

import { useActionState } from "react";
import {
  updateNewsletterPreferenceAction,
  type AccountFormState,
} from "@/app/account/actions";
import { CONSENT_WORDING } from "@/lib/account/consent";
import styles from "../account.module.css";

export function PreferencesForm({ optedIn }: { optedIn: boolean }) {
  const [state, action, pending] = useActionState(
    updateNewsletterPreferenceAction,
    {} as AccountFormState,
  );

  return (
    <form action={action} className={styles.panel}>
      <label className={styles.field}>
        <span>
          <input
            type="checkbox"
            name="newsletter"
            defaultChecked={optedIn}
          />{" "}
          {CONSENT_WORDING.ACCOUNT_PREFERENCES_NEWSLETTER.text}
        </span>
      </label>
      {state.message ? <p className={styles.success}>{state.message}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
