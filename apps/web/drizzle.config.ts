import { createRequire } from "node:module";
import { defineConfig } from "drizzle-kit";

import { env } from "@/env";

const require = createRequire(import.meta.url);

export default defineConfig({
  dialect: "postgresql",
  schema: require.resolve("@redshirt-sports/db/schema"),
  out: "./supabase/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
