"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  updateNewsletterPreferenceAction,
  type AccountFormState,
} from "@/app/account/actions";
import { CONSENT_WORDING } from "@/lib/account/consent";
import styles from "../account.module.css";

type NewsletterStatus =
  | "OPTED_IN"
  | "OPTED_OUT"
  | "PENDING_CONFIRMATION"
  | "SUPPRESSED";

export function PreferencesForm({ status }: { status: NewsletterStatus }) {
  const [state, action, pending] = useActionState(
    updateNewsletterPreferenceAction,
    {} as AccountFormState,
  );
  const canToggle = status === "OPTED_IN" || status === "OPTED_OUT";
  const pendingConfirmation = status === "PENDING_CONFIRMATION";
  const suppressed = status === "SUPPRESSED";

  return (
    <form action={action} className={styles.formPanel}>
      {suppressed ? (
        <p>
          This email is suppressed from marketing messages — for example after a
          provider complaint. That is not the same as an ordinary opt-out.{" "}
          <Link href="/contact/" className={styles.link}>
            Contact PLEBS
          </Link>{" "}
          if you need this reviewed.
        </p>
      ) : null}

      {pendingConfirmation ? (
        <p>
          Confirmation is still pending. Check your inbox for the confirmation
          email before newsletter sends will start. This is not an ordinary
          unsubscribed state.
        </p>
      ) : null}

      {canToggle ? (
        <label className={styles.consentField}>
          <input
            type="checkbox"
            name="newsletter"
            defaultChecked={status === "OPTED_IN"}
            disabled={pending}
          />
          <span>
            {CONSENT_WORDING.ACCOUNT_PREFERENCES_NEWSLETTER.text}{" "}
            <Link href="/privacy-policy/" className={styles.link}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      ) : (
        <p>
          {CONSENT_WORDING.ACCOUNT_PREFERENCES_NEWSLETTER.text}{" "}
          <Link href="/privacy-policy/" className={styles.link}>
            Privacy Policy
          </Link>
          .
        </p>
      )}

      <div className={styles.formStatus} aria-live="polite">
        {state.message ? <p className={styles.success}>{state.message}</p> : null}
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
      </div>

      {suppressed ? null : (
        <div className={styles.formActions}>
          <button className={styles.submit} type="submit" disabled={pending}>
            {pending
              ? "Saving…"
              : pendingConfirmation
                ? "Withdraw pending request"
                : "Save newsletter preference"}
          </button>
        </div>
      )}
    </form>
  );
}
