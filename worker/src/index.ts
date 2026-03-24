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

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const POLL_INTERVAL_MS = 30_000; // 30 seconds
const DELAY_BETWEEN_JOBS_MS = 5_000; // 5 seconds between same-company apps

let isProcessing = false;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", processing: isProcessing, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Worker running on port ${PORT}`);
  startPolling();
});

async function startPolling() {
  console.log(`Polling queue every ${POLL_INTERVAL_MS / 1000}s`);

  while (true) {
    try {
      await processNextJob();
    } catch (error) {
      console.error("Polling error:", error);
    }
    await delay(POLL_INTERVAL_MS);
  }
}

async function processNextJob() {
  if (isProcessing) return;

  const item = await pollQueue();
  if (!item) return;

  isProcessing = true;
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
    isProcessing = false;
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
