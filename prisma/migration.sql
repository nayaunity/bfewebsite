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
