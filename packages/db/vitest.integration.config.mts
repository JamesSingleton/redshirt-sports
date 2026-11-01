import { defineConfig } from "vitest/config";

/**
 * Real-Postgres tests for locking, upserts, and transactions.
 * Needs the local Supabase stack (`supabase start` in apps/web).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["integration/**/*.integration.test.ts"],
    globalSetup: ["./integration/global-setup.ts"],
    // Files share one database and truncate it between tests.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
