-- Soft-delete buffer for Vercel Blob URLs. See model comment in schema.prisma.
CREATE TABLE "ArchivedBlob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledPurgeAt" DATETIME NOT NULL,
    "reason" TEXT,
    "contextUserId" TEXT,
    "contextType" TEXT
);

CREATE UNIQUE INDEX "ArchivedBlob_url_key" ON "ArchivedBlob"("url");
CREATE INDEX "ArchivedBlob_scheduledPurgeAt_idx" ON "ArchivedBlob"("scheduledPurgeAt");
CREATE INDEX "ArchivedBlob_contextUserId_idx" ON "ArchivedBlob"("contextUserId");
