-- CreateTable
CREATE TABLE "LinkedInConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "linkedinPublicId" TEXT,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "currentCompany" TEXT,
    "companySlug" TEXT,
    "location" TEXT,
    "profileUrl" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "rawData" TEXT,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkedInConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkedInSyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "source" TEXT NOT NULL DEFAULT 'extension',
    "extensionVersion" TEXT,
    "connectionsSeen" INTEGER NOT NULL DEFAULT 0,
    "connectionsUpserted" INTEGER NOT NULL DEFAULT 0,
    "connectionsHidden" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "lastCursor" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "LinkedInSyncRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "resumeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'preview',
    "packetJson" TEXT NOT NULL,
    "adminNotes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "resumeName" TEXT,
    "resumeUrl" TEXT,
    "submittedAt" DATETIME,
    "followUpDueAt" DATETIME,
    "sentAt" DATETIME,
    "introMadeAt" DATETIME,
    "interviewAt" DATETIME,
    "offerAt" DATETIME,
    "hiredAt" DATETIME,
    "closedAt" DATETIME,
    "outcomeNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReferralRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralRequest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReferralRequest_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "LinkedInConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralRequest_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "UserResume" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralRequestEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referralRequestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralRequestEvent_referralRequestId_fkey" FOREIGN KEY ("referralRequestId") REFERENCES "ReferralRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInConnection_userId_profileUrl_key" ON "LinkedInConnection"("userId", "profileUrl");

-- CreateIndex
CREATE INDEX "LinkedInConnection_userId_status_idx" ON "LinkedInConnection"("userId", "status");

-- CreateIndex
CREATE INDEX "LinkedInConnection_userId_companySlug_idx" ON "LinkedInConnection"("userId", "companySlug");

-- CreateIndex
CREATE INDEX "LinkedInConnection_userId_linkedinPublicId_idx" ON "LinkedInConnection"("userId", "linkedinPublicId");

-- CreateIndex
CREATE INDEX "LinkedInSyncRun_userId_startedAt_idx" ON "LinkedInSyncRun"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "LinkedInSyncRun_status_startedAt_idx" ON "LinkedInSyncRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ReferralRequest_userId_createdAt_idx" ON "ReferralRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralRequest_userId_status_idx" ON "ReferralRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "ReferralRequest_jobId_createdAt_idx" ON "ReferralRequest"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralRequest_connectionId_createdAt_idx" ON "ReferralRequest"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralRequest_status_priority_createdAt_idx" ON "ReferralRequest"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralRequestEvent_referralRequestId_createdAt_idx" ON "ReferralRequestEvent"("referralRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralRequestEvent_type_createdAt_idx" ON "ReferralRequestEvent"("type", "createdAt");
