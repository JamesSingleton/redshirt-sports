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
      ],
      thresholds: {
        // Soft floors for branch-critical modules; raise overall over time.
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
        "app/api/vote/**": {
          statements: 85,
          branches: 75,
          functions: 85,
          lines: 85,
        },
        "app/api/webhooks/**": {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
