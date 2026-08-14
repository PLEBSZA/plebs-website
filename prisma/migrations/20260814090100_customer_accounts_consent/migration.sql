-- Customer identity, hashed setup/reset tokens, purpose-specific consent,
-- durable Resend outbox. Restock alertConsent keeps the existing
-- marketing_consent column so historic restock rows stay restock-scoped.

CREATE TYPE "AccountTokenPurpose" AS ENUM ('ACCOUNT_SETUP', 'PASSWORD_RESET', 'NEWSLETTER_CONFIRM');
CREATE TYPE "CommunicationPurpose" AS ENUM ('NEWSLETTER_EMAIL', 'RESTOCK_ALERT_EMAIL');
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL');
CREATE TYPE "PreferenceStatus" AS ENUM ('OPTED_OUT', 'PENDING_CONFIRMATION', 'OPTED_IN', 'SUPPRESSED');
CREATE TYPE "ConsentAction" AS ENUM ('GRANTED', 'WITHDRAWN', 'PENDING_CONFIRMATION', 'SUPPRESSED');
CREATE TYPE "ConsentActorType" AS ENUM ('CUSTOMER', 'SYSTEM', 'ADMIN', 'PROVIDER');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED');
CREATE TYPE "OutboxEventType" AS ENUM ('RESEND_CONTACT_SYNC', 'ACCOUNT_SETUP_EMAIL', 'PASSWORD_RESET_EMAIL', 'NEWSLETTER_CONFIRM_EMAIL', 'NEWSLETTER_WELCOME_EMAIL');

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
ALTER TABLE "users" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

ALTER TABLE "customers" ADD COLUMN "user_id" TEXT;
ALTER TABLE "customers" ADD COLUMN "resend_contact_id" TEXT;
ALTER TABLE "customers" ADD COLUMN "resend_sync_status" "OutboxStatus";
ALTER TABLE "customers" ADD COLUMN "resend_synced_at" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN "resend_last_error" TEXT;

CREATE UNIQUE INDEX "customers_user_id_key" ON "customers"("user_id");
CREATE UNIQUE INDEX "customers_resend_contact_id_key" ON "customers"("resend_contact_id");

ALTER TABLE "customers"
  ADD CONSTRAINT "customers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "account_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" "AccountTokenPurpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_tokens_token_hash_key" ON "account_tokens"("token_hash");
CREATE INDEX "account_tokens_user_id_purpose_created_at_idx" ON "account_tokens"("user_id", "purpose", "created_at");
CREATE INDEX "account_tokens_expires_at_idx" ON "account_tokens"("expires_at");

ALTER TABLE "account_tokens"
  ADD CONSTRAINT "account_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "communication_preferences" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "purpose" "CommunicationPurpose" NOT NULL,
    "channel" "CommunicationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "PreferenceStatus" NOT NULL DEFAULT 'OPTED_OUT',
    "source" TEXT,
    "wording_version" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "communication_preferences_customer_id_purpose_channel_key"
  ON "communication_preferences"("customer_id", "purpose", "channel");
CREATE INDEX "communication_preferences_purpose_status_idx"
  ON "communication_preferences"("purpose", "status");

ALTER TABLE "communication_preferences"
  ADD CONSTRAINT "communication_preferences_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "consent_events" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "purpose" "CommunicationPurpose" NOT NULL,
    "channel" "CommunicationChannel" NOT NULL DEFAULT 'EMAIL',
    "action" "ConsentAction" NOT NULL,
    "source" TEXT NOT NULL,
    "wording" TEXT NOT NULL,
    "wording_version" TEXT NOT NULL,
    "privacy_policy_version" TEXT NOT NULL,
    "actor_type" "ConsentActorType" NOT NULL DEFAULT 'CUSTOMER',
    "actor_id" TEXT,
    "provider_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consent_events_provider_event_id_key" ON "consent_events"("provider_event_id");
CREATE INDEX "consent_events_customer_id_created_at_idx" ON "consent_events"("customer_id", "created_at");
CREATE INDEX "consent_events_purpose_action_created_at_idx" ON "consent_events"("purpose", "action", "created_at");

ALTER TABLE "consent_events"
  ADD CONSTRAINT "consent_events_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "integration_outbox" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "event_type" "OutboxEventType" NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "provider_record_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "integration_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_outbox_idempotency_key_key" ON "integration_outbox"("idempotency_key");
CREATE INDEX "integration_outbox_status_next_attempt_at_idx" ON "integration_outbox"("status", "next_attempt_at");
CREATE INDEX "integration_outbox_customer_id_event_type_idx" ON "integration_outbox"("customer_id", "event_type");

ALTER TABLE "integration_outbox"
  ADD CONSTRAINT "integration_outbox_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "auth_throttles" (
    "id" TEXT NOT NULL,
    "throttle_key" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_throttles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_throttles_throttle_key_key" ON "auth_throttles"("throttle_key");
