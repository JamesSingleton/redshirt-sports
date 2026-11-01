import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Real-Postgres tests run separately: `pnpm test:integration`.
    exclude: [...configDefaults.exclude, "integration/**"],
  },
});
