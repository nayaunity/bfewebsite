ALTER TABLE "BrowseDiscovery" ADD COLUMN "atsType" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "jobDescriptionSnapshot" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "confidenceScore" REAL;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "confidenceBucket" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "confidenceReasons" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "graphStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "BrowseDiscovery" ADD COLUMN "planningDecision" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "userActionRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "personalizedWritingRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "customWritingDraft" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "customWritingFinal" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "customWritingEditedAt" DATETIME;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "customWritingApprovedAt" DATETIME;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "planPayload" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "graphThreadId" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "graphCheckpointId" TEXT;
ALTER TABLE "BrowseDiscovery" ADD COLUMN "reviewedAt" DATETIME;

CREATE TABLE "PlanningRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "graphVersion" TEXT NOT NULL DEFAULT 'v1',
  "pendingReviewCount" INTEGER NOT NULL DEFAULT 0,
  "autoSubmitCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "stateSnapshot" TEXT,
  "errorMessage" TEXT,
  "startedAt" DATETIME,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanningRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BrowseSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlanningRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PlanningRunEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "planningRunId" TEXT NOT NULL,
  "discoveryId" TEXT,
  "node" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "payload" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanningRunEvent_planningRunId_fkey" FOREIGN KEY ("planningRunId") REFERENCES "PlanningRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlanningRunEvent_discoveryId_fkey" FOREIGN KEY ("discoveryId") REFERENCES "BrowseDiscovery" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ReviewTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "discoveryId" TEXT NOT NULL,
  "planningRunId" TEXT,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'custom_writing',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "title" TEXT NOT NULL,
  "prompt" TEXT,
  "reason" TEXT,
  "requiredActions" TEXT,
  "draft" TEXT,
  "editedDraft" TEXT,
  "reviewerNotes" TEXT,
  "approvedAt" DATETIME,
  "rejectedAt" DATETIME,
  "reviewedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewTask_discoveryId_fkey" FOREIGN KEY ("discoveryId") REFERENCES "BrowseDiscovery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReviewTask_planningRunId_fkey" FOREIGN KEY ("planningRunId") REFERENCES "PlanningRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ReviewTask_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BrowseSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReviewTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ReviewTask_discoveryId_key" ON "ReviewTask"("discoveryId");
CREATE INDEX "BrowseDiscovery_graphStatus_idx" ON "BrowseDiscovery"("graphStatus");
CREATE INDEX "BrowseDiscovery_planningDecision_idx" ON "BrowseDiscovery"("planningDecision");
CREATE INDEX "BrowseDiscovery_atsType_graphStatus_idx" ON "BrowseDiscovery"("atsType", "graphStatus");
CREATE INDEX "PlanningRun_userId_createdAt_idx" ON "PlanningRun"("userId", "createdAt");
CREATE INDEX "PlanningRun_sessionId_createdAt_idx" ON "PlanningRun"("sessionId", "createdAt");
CREATE INDEX "PlanningRun_status_createdAt_idx" ON "PlanningRun"("status", "createdAt");
CREATE INDEX "PlanningRunEvent_planningRunId_createdAt_idx" ON "PlanningRunEvent"("planningRunId", "createdAt");
CREATE INDEX "PlanningRunEvent_discoveryId_createdAt_idx" ON "PlanningRunEvent"("discoveryId", "createdAt");
CREATE INDEX "PlanningRunEvent_node_createdAt_idx" ON "PlanningRunEvent"("node", "createdAt");
CREATE INDEX "ReviewTask_userId_status_createdAt_idx" ON "ReviewTask"("userId", "status", "createdAt");
CREATE INDEX "ReviewTask_sessionId_status_idx" ON "ReviewTask"("sessionId", "status");
