import { defineConfig } from "drizzle-kit";

import { env } from "@/env";

export default defineConfig({
  dialect: "postgresql",
  // schema: './server/db/schema.ts',
  schema: "../../packages/db/src/schema.ts",
  out: "./supabase/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
