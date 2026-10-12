-- AbandonedCheckout: one row per Stripe Checkout Session that expired unpaid
-- (checkout.session.expired) for the AI Video Editor offers. Lets
-- /admin/analytics show where buyers stop and keeps Stripe's 30-day recovery
-- link for each one.

CREATE TABLE "AbandonedCheckout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product" TEXT NOT NULL,
    "source" TEXT,
    "mode" TEXT NOT NULL,
    "amountCents" INTEGER,
    "email" TEXT,
    "name" TEXT,
    "promoConsent" TEXT,
    "recoveryUrl" TEXT,
    "recoveryExpiresAt" DATETIME,
    "startedAt" DATETIME NOT NULL,
    "expiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveredAt" DATETIME,
    "recoveredBy" TEXT
);

CREATE INDEX "AbandonedCheckout_product_idx" ON "AbandonedCheckout"("product");
CREATE INDEX "AbandonedCheckout_expiredAt_idx" ON "AbandonedCheckout"("expiredAt");
