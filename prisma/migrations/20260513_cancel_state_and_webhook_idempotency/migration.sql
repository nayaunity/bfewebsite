-- Adds:
--   1. User.cancelAtPeriodEnd (Boolean, default false) — local mirror of
--      Stripe's cancel_at_period_end so the UI can show "Cancellation
--      scheduled" deterministically on refresh, without a Stripe roundtrip.
--   2. StripeWebhookEvent table — idempotency log keyed on Stripe's event.id.
--      The webhook handler skips re-processing if a row already exists.

ALTER TABLE "User" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "StripeWebhookEvent_processedAt_idx" ON "StripeWebhookEvent"("processedAt");
CREATE INDEX "StripeWebhookEvent_type_idx" ON "StripeWebhookEvent"("type");
