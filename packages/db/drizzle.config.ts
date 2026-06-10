import type { Config } from "drizzle-kit";
import { keys } from "./keys";

export default {
  schema: "./src/schema.ts",
  out: "../../apps/web/supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: keys().POSTGRES_URL,
  },
} satisfies Config;
