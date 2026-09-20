import { keys as auth } from "@redshirt-sports/auth/keys";
import { keys as db } from "@redshirt-sports/db/keys";
import { keys as core } from "@redshirt-sports/next-config/keys";
import { keys as observability } from "@redshirt-sports/observability/keys";
import { keys as sanity } from "@redshirt-sports/sanity/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [core(), auth(), db(), observability(), sanity()],
  server: {
    /** Shared with web `/api/revalidate-tags` cacheTags path. */
    CACHE_REVALIDATE_SECRET: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    CACHE_REVALIDATE_SECRET: process.env.CACHE_REVALIDATE_SECRET,
  },
});
