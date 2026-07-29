"use client";

import { FormEvent, useState } from "react";
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
      data-event="contact_submit"
    >
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

      <button type="submit" className={styles.button}>
        Send Message
      </button>

      {status === "submitted" ? (
        <p className={styles.note} role="status">
          Thanks — the contact form is a prototype and is not connected to email
          delivery yet. Please use the published support address once it is
          confirmed.
        </p>
      ) : (
        <p className={styles.help}>
          Form submission remains a placeholder until the support inbox and
          delivery service are connected.
        </p>
      )}
    </form>
  );
}
