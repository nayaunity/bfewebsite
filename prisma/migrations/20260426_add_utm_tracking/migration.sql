-- Add UTM tracking fields to PagePresence
ALTER TABLE "PagePresence" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "PagePresence" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "PagePresence" ADD COLUMN "utmCampaign" TEXT;

-- Add UTM tracking and visitor linkage fields to User
ALTER TABLE "User" ADD COLUMN "visitorId" TEXT;
ALTER TABLE "User" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "User" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "User" ADD COLUMN "utmCampaign" TEXT;

-- Index for UTM analytics queries
CREATE INDEX "PagePresence_utmSource_idx" ON "PagePresence"("utmSource");
