"use client";

import styles from "@/components/layout/SiteFooter.module.css";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      className={styles.cookieButton}
      onClick={() => {
        window.dispatchEvent(new Event("plebs:open-cookie-settings"));
      }}
    >
      Cookie Settings
    </button>
  );
}
