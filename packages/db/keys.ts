import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      /**
       * Transaction pooler URL (Supabase port 6543). Used by the request-path
       * Postgres client with `prepare: false`.
       */
      DATABASE_URL: z.url(),
      /**
       * Session / direct URL (Supabase port 5432). Prefer for migrations,
       * drizzle-kit, and long-running jobs. Falls back to DATABASE_URL when unset.
       */
      DATABASE_DIRECT_URL: z.url().optional(),
    },
    runtimeEnv: {
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL,
    },
  });
