/**
 * Immutable consent wording versions. Legal review of live privacy/terms is
 * still required before treating this as a finished POPIA notice.
 */
export const PRIVACY_POLICY_VERSION = "privacy-policy-draft-unreviewed-2026-08";

export const CONSENT_WORDING = {
  NEWSLETTER_EMAIL: {
    version: "newsletter-email-v1-draft-2026-08",
    source: "footer_newsletter",
    text: "I agree that PLEBS may email me news, restocks and product updates. PLEBS will also create a free account and send a secure setup link. See the privacy policy.",
  },
  RESTOCK_ALERT_EMAIL: {
    version: "restock-alert-email-v2-2026-08",
    source: "restock_form",
    text: "I agree that PLEBS may email me when this colour and size is back in stock. PLEBS will also create a free account and send a secure setup link if you do not already have one. This does not subscribe me to the newsletter. See the privacy policy.",
  },
  ACCOUNT_PREFERENCES_NEWSLETTER: {
    version: "account-preferences-newsletter-v1-draft-2026-08",
    source: "account_preferences",
    text: "I agree that PLEBS may email me news, restocks and product updates. See the privacy policy.",
  },
  CHECKOUT_ACCOUNT_NOTICE: {
    version: "checkout-account-notice-v1-2026-08",
    source: "checkout",
    text: "We use these details to fulfil your order and send order updates. Placing an order creates a free PLEBS account and we email a secure setup link if you do not already have a password. This does not subscribe you to the newsletter. See the privacy policy.",
  },
  ACCOUNT_REGISTER: {
    version: "account-register-v1-2026-08",
    source: "account_register",
    text: "Enter your email to create a PLEBS account. We will send a secure setup link. This does not subscribe you to the newsletter.",
  },
  CHECKOUT_OPTIONAL_MARKETING: {
    version: "checkout-optional-marketing-v1-draft-2026-08",
    source: "checkout_optional_marketing",
    text: "Email me PLEBS news and product updates. Optional — not required to complete this order.",
  },
} as const;

export const GENERIC_ACCOUNT_RESPONSE =
  "If this email can be used with PLEBS, we have sent the next step.";

export const ACCOUNT_SETUP_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const TOKEN_RESEND_COOLDOWN_MS = 15 * 60 * 1000;
export const TOKEN_DAILY_LIMIT = 5;
export const AUTH_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_THROTTLE_MAX_ATTEMPTS = 8;
export const MIN_PASSWORD_LENGTH = 8;
export const OUTBOX_STALE_PROCESSING_MS = 5 * 60 * 1000;
