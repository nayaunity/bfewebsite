"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const browse_loop_1 = require("./browse-loop");
const apply_engine_1 = require("./apply-engine");
const POLL_INTERVAL_MS = 15_000;
let running = true;
async function main() {
    console.log("Local browse worker started");
    console.log(`Headless: ${process.env.HEADLESS !== "false" ? "yes" : "no (visible browser)"}`);
    console.log(`Polling every ${POLL_INTERVAL_MS / 1000}s for browse sessions...\n`);
    while (running) {
        try {
            const processed = await (0, browse_loop_1.processNextBrowseSession)();
            if (processed) {
                // Release the Browserbase session between BrowseSessions — leaving it
                // idle costs minutes. Vanilla Playwright is a local process, so we can
                // leave it warm.
                if (process.env.USE_BROWSERBASE === "true") {
                    await (0, apply_engine_1.closeBrowser)();
                }
                console.log("\nSession complete. Checking for more...\n");
                continue; // Check immediately for another session
            }
        }
        catch (error) {
            console.error("Error processing session:", error);
            if (process.env.USE_BROWSERBASE === "true") {
                await (0, apply_engine_1.closeBrowser)().catch(() => { });
            }
        }
        await delay(POLL_INTERVAL_MS);
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
process.on("SIGTERM", async () => {
    console.log("\nShutting down browse worker...");
    running = false;
    await (0, apply_engine_1.closeBrowser)();
    process.exit(0);
});
process.on("SIGINT", async () => {
    console.log("\nShutting down browse worker...");
    running = false;
    await (0, apply_engine_1.closeBrowser)();
    process.exit(0);
});
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
