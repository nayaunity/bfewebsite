-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LessonProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companySlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "salary" TEXT,
    "postedAt" DATETIME,
    "applyUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ScrapeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companySlug" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jobsFound" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LessonProgress_userId_idx" ON "LessonProgress"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LessonProgress_courseId_idx" ON "LessonProgress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LessonProgress_userId_courseId_lessonSlug_key" ON "LessonProgress"("userId", "courseId", "lessonSlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_category_idx" ON "Job"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_remote_idx" ON "Job"("remote");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_isActive_idx" ON "Job"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_companySlug_idx" ON "Job"("companySlug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Job_externalId_companySlug_key" ON "Job"("externalId", "companySlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ScrapeLog_companySlug_idx" ON "ScrapeLog"("companySlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ScrapeLog_createdAt_idx" ON "ScrapeLog"("createdAt");

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companySlug" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobClick_companySlug_idx" ON "JobClick"("companySlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobClick_clickedAt_idx" ON "JobClick"("clickedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobClick_jobId_idx" ON "JobClick"("jobId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "MicroWin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "authorName" TEXT,
    "authorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MicroWin_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MicroWin_status_idx" ON "MicroWin"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MicroWin_promptType_idx" ON "MicroWin"("promptType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MicroWin_createdAt_idx" ON "MicroWin"("createdAt");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateTable
CREATE TABLE IF NOT EXISTS "PagePresence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "country" TEXT,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PagePresence_visitorId_page_key" ON "PagePresence"("visitorId", "page");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PagePresence_page_idx" ON "PagePresence"("page");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PagePresence_lastSeenAt_idx" ON "PagePresence"("lastSeenAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PagePresence_country_idx" ON "PagePresence"("country");

-- Add country column if table already exists
ALTER TABLE "PagePresence" ADD COLUMN "country" TEXT;

-- Add auto-apply profile fields to User
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "autoApplyEnabled" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "externalJobId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companySlug" TEXT NOT NULL,
    "boardToken" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JobApplication_userId_jobId_key" ON "JobApplication"("userId", "jobId");
CREATE INDEX IF NOT EXISTS "JobApplication_userId_idx" ON "JobApplication"("userId");
CREATE INDEX IF NOT EXISTS "JobApplication_jobId_idx" ON "JobApplication"("jobId");
CREATE INDEX IF NOT EXISTS "JobApplication_status_idx" ON "JobApplication"("status");
CREATE INDEX IF NOT EXISTS "JobApplication_companySlug_idx" ON "JobApplication"("companySlug");
CREATE INDEX IF NOT EXISTS "JobApplication_createdAt_idx" ON "JobApplication"("createdAt");

-- CreateTable
CREATE TABLE IF NOT EXISTS "AutoApplyRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "submitted" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutoApplyRun_userId_idx" ON "AutoApplyRun"("userId");
CREATE INDEX IF NOT EXISTS "AutoApplyRun_startedAt_idx" ON "AutoApplyRun"("startedAt");

-- Add custom question answer fields to User
ALTER TABLE "User" ADD COLUMN "usState" TEXT;
ALTER TABLE "User" ADD COLUMN "workAuthorized" BOOLEAN;
ALTER TABLE "User" ADD COLUMN "needsSponsorship" BOOLEAN;
ALTER TABLE "User" ADD COLUMN "countryOfResidence" TEXT;

-- Add subscription fields to User
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'inactive';
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "currentPeriodEnd" DATETIME;
ALTER TABLE "User" ADD COLUMN "monthlyAppCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "monthlyAppResetAt" DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier");

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserResume_userId_idx" ON "UserResume"("userId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApplyQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "resumeUrl" TEXT NOT NULL,
    "resumeName" TEXT NOT NULL,
    "applicantData" TEXT NOT NULL,
    "workerNote" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "ApplyQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplyQueue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApplyQueue_userId_jobId_key" ON "ApplyQueue"("userId", "jobId");
CREATE INDEX IF NOT EXISTS "ApplyQueue_status_idx" ON "ApplyQueue"("status");
CREATE INDEX IF NOT EXISTS "ApplyQueue_createdAt_idx" ON "ApplyQueue"("createdAt");
CREATE INDEX IF NOT EXISTS "ApplyQueue_userId_idx" ON "ApplyQueue"("userId");
