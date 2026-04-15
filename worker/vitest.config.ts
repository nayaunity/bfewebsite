import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Playwright-based tests can't run in parallel without port contention
    // and also take longer than pure-unit tests. Keep serial for now.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 60_000,
  },
});
