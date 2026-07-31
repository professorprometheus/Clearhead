CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "stripe_customer_id" text
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_stripe_customer_id_idx" ON "user" ("stripe_customer_id");

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_identity_idx" ON "account" ("provider_id", "account_id");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "subscription" (
  "id" text PRIMARY KEY NOT NULL,
  "plan" text NOT NULL,
  "reference_id" text NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "status" text NOT NULL,
  "period_start" timestamptz,
  "period_end" timestamptz,
  "cancel_at_period_end" boolean DEFAULT false,
  "cancel_at" timestamptz,
  "canceled_at" timestamptz,
  "ended_at" timestamptz,
  "seats" integer,
  "trial_start" timestamptz,
  "trial_end" timestamptz,
  "billing_interval" text,
  "stripe_schedule_id" text
);
CREATE INDEX IF NOT EXISTS "subscription_reference_id_idx" ON "subscription" ("reference_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_stripe_id_idx" ON "subscription" ("stripe_subscription_id");

CREATE TABLE IF NOT EXISTS "user_profile" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "trial_start" timestamptz NOT NULL,
  "trial_end" timestamptz NOT NULL,
  "trial_reminder_stage" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "processed_stripe_webhook" (
  "event_id" text PRIMARY KEY NOT NULL,
  "event_type" text NOT NULL,
  "processed_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "synced_clearhead_state" (
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "device_id" text NOT NULL,
  "revision" integer DEFAULT 1 NOT NULL,
  "state" jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "device_id")
);
