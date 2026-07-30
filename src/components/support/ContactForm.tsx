"use client";

import { FormEvent, useRef, useState } from "react";
import styles from "./ContactForm.module.css";

const enquiryTypes = [
  "Product and sizing question",
  "Existing order",
  "Exchange or return",
  "Stock or restock",
  "Press or collaboration",
  "General enquiry",
] as const;

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "submitted" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const submissionIdRef = useRef<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setStatus("submitting");
    setMessage("");

    const data = Object.fromEntries(new FormData(form));
    submissionIdRef.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          submissionId: submissionIdRef.current,
        }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(result.message ?? "Your message could not be sent.");
        return;
      }

      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: { event: "contact_submit" },
        }),
      );
      form.reset();
      submissionIdRef.current = null;
      setStatus("submitted");
      setMessage("Thanks — your message has been sent to PLEBS.");
    } catch {
      setStatus("error");
      setMessage("Your message could not be sent. Please try again.");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-name">Name</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-order">Order number (optional)</label>
        <input id="contact-order" name="orderNumber" type="text" autoComplete="off" />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-type">Enquiry type</label>
        <select id="contact-type" name="enquiryType" required defaultValue="">
          <option value="" disabled>
            Choose an option
          </option>
          {enquiryTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" rows={6} required />
      </div>

      <button
        type="submit"
        className={styles.button}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>

      {status === "submitted" || status === "error" ? (
        <p
          className={status === "error" ? styles.error : styles.note}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : (
        <p className={styles.help}>
          Your message will be delivered to hello@plebs.co.za.
        </p>
      )}
    </form>
  );
}
