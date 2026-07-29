"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { useStorefrontCatalogue } from "@/components/commerce/StorefrontCatalogueProvider";
import styles from "./RestockNotifyForm.module.css";

type RestockNotifyFormProps = {
  defaultSize?: string;
  colour?: string;
};

export function RestockNotifyForm({
  defaultSize,
  colour = "Forest Green",
}: RestockNotifyFormProps) {
  const catalogue = useStorefrontCatalogue();
  const unavailableSizes = catalogue.sizes.filter((entry) => !entry.available);
  const initialSize =
    defaultSize ??
    unavailableSizes.find((entry) => entry.name === "M")?.name ??
    unavailableSizes[0]?.name ??
    "M";

  const formId = useId();
  const [email, setEmail] = useState("");
  const [size, setSize] = useState(initialSize);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/restock/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, size, colour }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "Unable to save your restock request.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "We'll let you know when this size returns.");
      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: {
            event: "restock_signup",
            selected_size: size,
            availability: "out_of_stock",
            colour,
          },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("plebs:commerce-event", {
          detail: {
            event: "out_of_stock_size_interest",
            selected_size: size,
            availability: "out_of_stock",
            colour,
          },
        }),
      );
    } catch {
      setStatus("error");
      setMessage("Unable to save your restock request. Please try again.");
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      data-event="restock_signup"
      aria-labelledby={`${formId}-title`}
    >
      <h3 id={`${formId}-title`} className={styles.title}>
        Notify me when my size is back in stock
      </h3>
      <p className={styles.help}>
        We&apos;ll email you when the selected size becomes available. We do not
        promise restock dates.
      </p>

      <label className={styles.label} htmlFor={`${formId}-email`}>
        Email address
      </label>
      <input
        id={`${formId}-email`}
        className={styles.input}
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label className={styles.label} htmlFor={`${formId}-size`}>
        Size
      </label>
      <select
        id={`${formId}-size`}
        className={styles.input}
        name="size"
        value={size}
        onChange={(event) => setSize(event.target.value)}
        required
      >
        {unavailableSizes.map((entry) => (
          <option key={entry.id} value={entry.name}>
            {entry.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className={styles.button}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Saving…" : "Notify Me"}
      </button>

      {message ? (
        <p
          className={status === "error" ? styles.error : styles.success}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <p className={styles.note}>
        Prefer measuring first?{" "}
        <Link href="/size-guide/" data-event="view_size_guide">
          View the size guide
        </Link>
        .
      </p>
    </form>
  );
}
