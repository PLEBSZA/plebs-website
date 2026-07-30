"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import styles from "./NewsletterForm.module.css";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) return;
    setStatus("submitted");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor="newsletter-email">
        Join the PLEBS
      </label>
      <p className={styles.help}>
        Restocks, product updates and occasional stories. Signup remains a
        placeholder until the mailing service is connected.
      </p>
      <div className={styles.row}>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={!consent}>
          Sign Up
        </button>
      </div>
      <label className={styles.consent}>
        <input
          type="checkbox"
          name="marketingConsent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <span>
          I agree that PLEBS may use my email for restocks and updates. See the{" "}
          <Link href="/privacy-policy/">privacy policy</Link>.
        </span>
      </label>
      {status === "submitted" ? (
        <p className={styles.note} role="status">
          Thanks — newsletter capture is not connected yet.
        </p>
      ) : null}
    </form>
  );
}
