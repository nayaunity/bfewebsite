import "dotenv/config";
import { processNextBrowseSession } from "./browse-loop";
import { closeBrowser } from "./apply-engine";

const POLL_INTERVAL_MS = 15_000;
let running = true;

async function main() {
  console.log("Local browse worker started");
  console.log(`Headless: ${process.env.HEADLESS !== "false" ? "yes" : "no (visible browser)"}`);
  console.log(`Polling every ${POLL_INTERVAL_MS / 1000}s for browse sessions...\n`);

  while (running) {
    try {
      const processed = await processNextBrowseSession();
      if (processed) {
        // Release the Browserbase session between BrowseSessions — leaving it
        // idle costs minutes. Vanilla Playwright is a local process, so we can
        // leave it warm.
        if (process.env.USE_BROWSERBASE === "true") {
          await closeBrowser();
        }
        console.log("\nSession complete. Checking for more...\n");
        continue; // Check immediately for another session
      }
    } catch (error) {
      console.error("Error processing session:", error);
      if (process.env.USE_BROWSERBASE === "true") {
        await closeBrowser().catch(() => {});
      }
    }

    await delay(POLL_INTERVAL_MS);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on("SIGTERM", async () => {
  console.log("\nShutting down browse worker...");
  running = false;
  await closeBrowser();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nShutting down browse worker...");
  running = false;
  await closeBrowser();
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
