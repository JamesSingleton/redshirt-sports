import type { Config } from "drizzle-kit";

import { keys } from "./keys";

const env = keys();

export default {
  schema: "./src/schema.ts",
  out: "../../apps/web/supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Prefer direct/session URL for migrations; pooler stays on the request path.
    url: env.DATABASE_DIRECT_URL ?? env.DATABASE_URL,
  },
} satisfies Config;
