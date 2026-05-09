-- Add health oversight fields to BrowseSession
ALTER TABLE "BrowseSession" ADD COLUMN "qualityThreshold" REAL;
ALTER TABLE "BrowseSession" ADD COLUMN "healthCheckId" TEXT;

-- Create HealthCheck table
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "runDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacingStatus" TEXT NOT NULL,
    "appsSent" INTEGER NOT NULL,
    "effectiveCap" INTEGER NOT NULL,
    "daysRemaining" INTEGER NOT NULL,
    "dailyCapAssigned" INTEGER NOT NULL,
    "qualityThreshold" REAL,
    "matchMultiplier" INTEGER NOT NULL DEFAULT 3,
    "strategy" TEXT NOT NULL,
    "remediationActions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "HealthCheck_userId_runDate_idx" ON "HealthCheck"("userId", "runDate");
CREATE INDEX "HealthCheck_runDate_idx" ON "HealthCheck"("runDate");

-- Create MatchQualityAudit table
CREATE TABLE "MatchQualityAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discoveryId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "userTargetRoles" TEXT NOT NULL,
    "qualityVerdict" TEXT NOT NULL,
    "qualityScore" REAL,
    "reasoning" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MatchQualityAudit_userId_createdAt_idx" ON "MatchQualityAudit"("userId", "createdAt");
CREATE INDEX "MatchQualityAudit_sessionId_idx" ON "MatchQualityAudit"("sessionId");
CREATE INDEX "MatchQualityAudit_qualityVerdict_createdAt_idx" ON "MatchQualityAudit"("qualityVerdict", "createdAt");
