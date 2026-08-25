import { keys as analytics } from "@redshirt-sports/analytics/keys";
import { keys as auth } from "@redshirt-sports/auth/keys";
import { keys as db } from "@redshirt-sports/db/keys";
import { keys as core } from "@redshirt-sports/next-config/keys";
import { keys as observability } from "@redshirt-sports/observability/keys";
import { keys as sanity } from "@redshirt-sports/sanity/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [core(), observability(), analytics(), auth(), db(), sanity()],
  server: {
    SCHOOL_SYNC_SECRET: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    SCHOOL_SYNC_SECRET: process.env.SCHOOL_SYNC_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
});
