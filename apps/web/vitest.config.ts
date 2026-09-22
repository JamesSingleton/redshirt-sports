import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "__tests__/mocks/server-only.ts"),
    },
  },
  test: {
    coverage: {
      enabled: true,
      provider: "v8",
      reportOnFailure: true,
      reporter: ["text", "json-summary", "json"],
      include: [
        "hooks/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "utils/**/*.{ts,tsx}",
        "actions/**/*.{ts,tsx}",
        "server/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "proxy.ts",
      ],
      exclude: [
        "app/__transfer-portal/**",
        "app/__recruiting/**",
        "app/__players/**",
        "utils/espn.ts",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        "lib/rankings-movement.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "lib/require-poll-voter.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "lib/vote-ballot.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
