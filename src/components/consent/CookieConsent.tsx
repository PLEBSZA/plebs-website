"use client";

import { useEffect, useId, useState } from "react";
import { useConsent } from "./ConsentProvider";
import styles from "./CookieConsent.module.css";

export function CookieConsent() {
  const {
    preferences,
    resolved,
    needsPrompt,
    preferencesOpen,
    openPreferences,
    closePreferences,
    acceptAll,
    rejectNonEssential,
    savePreferences,
  } = useConsent();
  const titleId = useId();
  const [draftAnalytics, setDraftAnalytics] = useState(preferences.analytics);
  const [draftMarketing, setDraftMarketing] = useState(preferences.marketing);

  const showBanner = resolved && needsPrompt && !preferencesOpen;

  // Keep draft values in sync when the preferences panel opens.
  const panelAnalytics = preferencesOpen ? draftAnalytics : preferences.analytics;
  const panelMarketing = preferencesOpen ? draftMarketing : preferences.marketing;

  useEffect(() => {
    function onOpenSettings() {
      openPreferences();
    }

    window.addEventListener("plebs:open-cookie-settings", onOpenSettings);
    return () => {
      window.removeEventListener("plebs:open-cookie-settings", onOpenSettings);
    };
  }, [openPreferences]);

  if (!resolved) return null;

  return (
    <>
      {showBanner ? (
        <div
          className={styles.banner}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <div className={styles.bannerInner}>
            <div>
              <h2 id={titleId} className={styles.title}>
                Cookies and privacy
              </h2>
              <p className={styles.copy}>
                Necessary cookies keep the cart, checkout and preference
                controls working. Analytics and marketing cookies load only if
                you allow them.
              </p>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={rejectNonEssential}
              >
                Reject non-essential
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setDraftAnalytics(preferences.analytics);
                  setDraftMarketing(preferences.marketing);
                  openPreferences();
                }}
              >
                Customise
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={acceptAll}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preferencesOpen ? (
        <div className={styles.overlay} role="presentation">
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-panel`}
          >
            <h2 id={`${titleId}-panel`} className={styles.title}>
              Cookie settings
            </h2>
            <p className={styles.copy}>
              Choose which optional categories PLEBS may use. Necessary cookies
              always remain active.
            </p>

            <fieldset className={styles.fieldset}>
              <label className={styles.option}>
                <input type="checkbox" checked disabled />
                <span>
                  <strong>Necessary</strong>
                  Cart state, checkout session, security and cookie preferences.
                </span>
              </label>
              <label className={styles.option}>
                <input
                  type="checkbox"
                  checked={panelAnalytics}
                  onChange={(event) => setDraftAnalytics(event.target.checked)}
                />
                <span>
                  <strong>Analytics</strong>
                  Site usage and ecommerce funnel measurement.
                </span>
              </label>
              <label className={styles.option}>
                <input
                  type="checkbox"
                  checked={panelMarketing}
                  onChange={(event) => setDraftMarketing(event.target.checked)}
                />
                <span>
                  <strong>Marketing</strong>
                  Advertising pixels and campaign measurement, when connected.
                </span>
              </label>
            </fieldset>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={closePreferences}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() =>
                  savePreferences({
                    analytics: draftAnalytics,
                    marketing: draftMarketing,
                  })
                }
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
