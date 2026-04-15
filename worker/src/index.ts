import "dotenv/config";
import express from "express";
import {
  pollQueue,
  markCompleted,
  markFailed,
  recordApplication,
  incrementUserAppCount,
} from "./db";
import { applyToJob, closeBrowser } from "./apply-engine";
import { processNextBrowseSession } from "./browse-loop";
import { logEgressIpOnce, logBrowserBinaryOnce } from "./diagnostics";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const POLL_INTERVAL_MS = 30_000;
const DELAY_BETWEEN_JOBS_MS = 5_000;
const MAX_CONCURRENT = 2;

let activeBrowseSessions = 0;
let isProcessingQueue = false;
let sessionsProcessedToday = 0;
let lastSessionAt: string | null = null;
const startedAt = new Date().toISOString();

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    activeBrowseSessions,
    isProcessingQueue,
    maxConcurrent: MAX_CONCURRENT,
    sessionsProcessedToday,
    lastSessionAt,
    uptime: Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
    startedAt,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Worker running on port ${PORT} (max ${MAX_CONCURRENT} concurrent sessions)`);
  logEgressIpOnce().catch(() => { /* non-fatal */ });
  logBrowserBinaryOnce().catch(() => { /* non-fatal */ });
  startPolling();
});

async function startPolling() {
  console.log(`Polling every ${POLL_INTERVAL_MS / 1000}s`);

  while (true) {
    try {
      // Process queue jobs (legacy path)
      if (!isProcessingQueue) {
        processNextJob().catch((err) => console.error("Queue job error:", err));
      }

      // Process browse sessions — fill up to MAX_CONCURRENT slots per poll
      while (activeBrowseSessions < MAX_CONCURRENT) {
        activeBrowseSessions++;
        processNextBrowseSession()
          .then((found) => {
            if (found) {
              sessionsProcessedToday++;
              lastSessionAt = new Date().toISOString();
            }
          })
          .catch((err) => console.error("Browse session error:", err))
          .finally(() => { activeBrowseSessions--; });
        // Small delay between launches to avoid racing for the same session
        await delay(1000);
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
    await delay(POLL_INTERVAL_MS);
  }
}

async function processNextJob() {
  if (isProcessingQueue) return;

  const item = await pollQueue();
  if (!item) return;

  isProcessingQueue = true;
  console.log(`Processing: ${item.job.title} at ${item.job.company}`);

  try {
    const applicant = JSON.parse(item.applicantData);

    const result = await applyToJob(
      item.job.applyUrl,
      applicant,
      item.resumeUrl,
      item.resumeName
    );

    if (result.success) {
      await markCompleted(item.id, "Application submitted via browser");
      await recordApplication(
        item.userId,
        item.jobId,
        item.job.company,
        item.job.companySlug,
        item.job.title,
        "submitted"
      );
      console.log(`Submitted: ${item.job.title} at ${item.job.company}`);
    } else {
      await markFailed(item.id, result.error || "Unknown error");
      await recordApplication(
        item.userId,
        item.jobId,
        item.job.company,
        item.job.companySlug,
        item.job.title,
        "failed",
        result.error
      );
      console.log(`Failed: ${item.job.title} — ${result.error}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await markFailed(item.id, msg);
    console.error(`Error processing ${item.job.title}:`, msg);
  } finally {
    isProcessingQueue = false;
    await delay(DELAY_BETWEEN_JOBS_MS);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await closeBrowser();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await closeBrowser();
  process.exit(0);
});
