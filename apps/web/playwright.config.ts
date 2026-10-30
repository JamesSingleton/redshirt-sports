import { defineConfig, devices } from "@playwright/test";

const port = 3005;
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL,
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm exec next start -H 127.0.0.1 -p ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
