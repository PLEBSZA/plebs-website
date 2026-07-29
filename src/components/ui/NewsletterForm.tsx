"use client";

import { FormEvent, useState } from "react";
import styles from "./NewsletterForm.module.css";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitted");
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      data-event="newsletter_signup"
    >
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
        <button type="submit" className={styles.button}>
          Sign Up
        </button>
      </div>
      {status === "submitted" ? (
        <p className={styles.note} role="status">
          Thanks — newsletter capture is not connected yet.
        </p>
      ) : null}
    </form>
  );
}
