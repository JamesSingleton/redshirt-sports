import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      POSTGRES_URL: z.url(),
      SUPABASE_URL: z.url(),
      SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    },
    runtimeEnv: {
      POSTGRES_URL: process.env.POSTGRES_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
