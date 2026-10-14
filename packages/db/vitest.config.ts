import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({
  path: resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../apps/web/.env.local",
  ),
});

export default defineConfig({
  test: {
    globals: true,
  },
});
