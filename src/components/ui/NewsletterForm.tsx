"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import styles from "./NewsletterForm.module.css";
import { CONSENT_WORDING } from "@/lib/account/consent";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) return;
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "Unable to save your subscription.");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "Check your email to confirm.");
      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: { event: "newsletter_signup" },
        }),
      );
    } catch {
      setStatus("error");
      setMessage("Unable to save your subscription. Please try again.");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor="newsletter-email">
        Join the PLEBS
      </label>
      <p className={styles.help}>
        Restocks, product updates and occasional stories. We will create a free
        account and send a confirmation plus setup link.
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
        <button type="submit" className={styles.button} disabled={!consent || status === "loading"}>
          {status === "loading" ? "Saving…" : "Sign Up"}
        </button>
      </div>
      <label className={styles.consent}>
        <input
          type="checkbox"
          name="newsletterConsent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <span>
          {CONSENT_WORDING.NEWSLETTER_EMAIL.text} See the{" "}
          <Link href="/privacy-policy/">privacy policy</Link>.
        </span>
      </label>
      {message ? (
        <p className={styles.note} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
